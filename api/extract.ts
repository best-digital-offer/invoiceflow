import type { IncomingMessage, ServerResponse } from 'node:http';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
  maxDuration: 30,
};

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_PDF_PAGES = 100;

function sendJson(res: ServerResponse, status: number, body: Record<string, unknown>) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

async function readPdfBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of req) {
    const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += part.length;
    if (size > MAX_UPLOAD_BYTES) {
      const error = new Error('PDF exceeds the 4 MB upload limit for this Vercel endpoint.');
      (error as Error & { statusCode?: number }).statusCode = 413;
      throw error;
    }
    chunks.push(part);
  }

  return Buffer.concat(chunks);
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { detail: 'Use POST with a PDF request body.' });
  }

  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  if (!contentType.includes('application/pdf') && !contentType.includes('application/octet-stream')) {
    return sendJson(res, 415, { detail: 'Send the PDF as the raw request body with Content-Type application/pdf.' });
  }

  try {
    const buffer = await readPdfBody(req);
    if (buffer.length < 5 || buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
      return sendJson(res, 400, { detail: 'The uploaded file is not a valid PDF.' });
    }

    const loadingTask = getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      isEvalSupported: false,
      disableFontFace: true,
    });
    const pdf = await loadingTask.promise;

    try {
      if (pdf.numPages > MAX_PDF_PAGES) {
        return sendJson(res, 413, { detail: `PDF has ${pdf.numPages} pages; the maximum is ${MAX_PDF_PAGES}.` });
      }

      const pages: Array<{ page: number; text: string; extraction_method: string }> = [];
      const pageTexts: string[] = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => {
            if (!('str' in item) || typeof item.str !== 'string' || !item.str) return '';
            return item.hasEOL ? item.str + '\n' : item.str + ' ';
          })
          .join('')
          .replace(/[ \t]+/g, ' ')
          .replace(/ *\n */g, '\n')
          .trim();
        pages.push({
          page: pageNumber,
          text: pageText,
          extraction_method: pageText ? 'pdfjs_text' : 'no_text_layer',
        });
        pageTexts.push(pageText);
        page.cleanup();
      }

      const combinedText = pageTexts.filter(Boolean).join('\n\n').trim();
      const pagesRequiringOcr = pages.filter((page) => !page.text).map((page) => page.page);
      if (!combinedText) {
        return sendJson(res, 422, {
          detail: 'No selectable text was found. This may be a scanned PDF; browser-side OCR support is not enabled yet.',
          page_count: pdf.numPages,
          ocr_required: true,
          pages_requiring_ocr: pagesRequiringOcr,
        });
      }

      return sendJson(res, 200, {
        page_count: pdf.numPages,
        pages,
        combined_text: combinedText,
        ocr_used: false,
        ocr_required: pagesRequiringOcr.length > 0,
        pages_requiring_ocr: pagesRequiringOcr,
        extraction_method: 'pdfjs_text',
      });
    } finally {
      await pdf.destroy();
    }
  } catch (error) {
    const statusCode = (error as Error & { statusCode?: number }).statusCode;
    const message = error instanceof Error ? error.message : 'PDF extraction failed.';
    return sendJson(res, statusCode || 400, { detail: message });
  }
}
