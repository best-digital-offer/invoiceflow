import type { IncomingMessage, ServerResponse } from 'node:http';
// Import the parser implementation directly. The package root index.js runs a
// bundled-incompatible debug self-test when Vercel's bundler removes module.parent,
// attempting to read ./test/data/05-versions-space.pdf at runtime.
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

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

    const parsed = await pdfParse(buffer, { max: MAX_PDF_PAGES });
    const pageCount = Number(parsed.numpages) || 0;
    if (pageCount > MAX_PDF_PAGES) {
      return sendJson(res, 413, { detail: `PDF has ${pageCount} pages; the maximum is ${MAX_PDF_PAGES}.` });
    }

    const combinedText = String(parsed.text || '')
      .replace(/\r\n?/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n[ \t]+/g, '\n')
      .trim();

    if (!combinedText) {
      return sendJson(res, 422, {
        detail: 'No selectable text was found. This may be a scanned PDF; OCR support is not enabled yet.',
        page_count: pageCount,
        ocr_required: true,
        pages_requiring_ocr: Array.from({ length: pageCount }, (_, index) => index + 1),
      });
    }

    const pages = [{
      page: 1,
      text: combinedText,
      extraction_method: 'pdf_parse_text',
    }];

    return sendJson(res, 200, {
      page_count: pageCount,
      pages,
      combined_text: combinedText,
      ocr_used: false,
      ocr_required: false,
      pages_requiring_ocr: [],
      extraction_method: 'pdf_parse_text',
    });
  } catch (error) {
    const statusCode = (error as Error & { statusCode?: number }).statusCode;
    const message = error instanceof Error ? error.message : 'PDF extraction failed.';
    console.error('InvoiceFlow PDF extraction failed:', error);
    return sendJson(res, statusCode || 400, { detail: message });
  }
}
