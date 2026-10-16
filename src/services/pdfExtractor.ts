import { BackendConfig, Currency, ExtractionMethod, Invoice, InvoiceLineItem } from '../types';
import { DeterministicValidationEngine } from './validationEngine';

export interface ExtractionProgressCallback {
  (stage: 'reading_file' | 'extracting_text' | 'parsing_fields' | 'validating' | 'completed', percent: number, message: string): void;
}

export interface ExtractionResult {
  invoice: Partial<Invoice>;
  rawExtractedText: string;
  extractionMethod: ExtractionMethod;
  isBackendResult: boolean;
  warnings: string[];
}

export class InvoiceExtractionService {
  /**
   * Main entrypoint for processing an uploaded file.
   * If Vercel API routing is active, sends the PDF to InvoiceFlow's same-origin extraction endpoint.
   * Otherwise uses deterministic client-side extraction with clear labeling.
   */
  static async processFile(
    file: File,
    config: BackendConfig,
    onProgress?: ExtractionProgressCallback
  ): Promise<ExtractionResult> {
    onProgress?.('reading_file', 15, `Reading ${file.name} (${Math.round(file.size / 1024)} KB)...`);

    // 1. If Vercel API routing is enabled, call the same-origin extraction endpoint
    if (config.useLiveBackend && config.baseUrl) {
      try {
        onProgress?.('extracting_text', 35, `Sending to backend API at ${config.baseUrl}...`);
        const result = await this.callBackendApi(file, config, onProgress);
        return result;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Unknown backend error';
        // Never disguise a failed live API request as a successful local extraction.
        throw new Error(`Invoice API request failed: ${errMsg}`);
      }
    }

    // 2. Otherwise run deterministic browser engine
    return this.extractInBrowser(file, onProgress);
  }

  /**
   * Calls InvoiceFlow's Vercel serverless extraction endpoint:
   * POST /extract
   * Content-Type: multipart/form-data; file=@filename.pdf
   */
  private static async callBackendApi(
    file: File,
    config: BackendConfig,
    onProgress?: ExtractionProgressCallback
  ): Promise<ExtractionResult> {
    if (file.size > 4 * 1024 * 1024) {
      throw new Error('This Vercel extraction endpoint currently supports PDF files up to 4 MB.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs || 30000);
    onProgress?.('extracting_text', 50, 'Extracting selectable PDF text through the Vercel API...');

    const headers: Record<string, string> = { 'Content-Type': 'application/pdf' };
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
      headers['X-API-Key'] = config.apiKey;
    }

    const endpoint = `${config.baseUrl.replace(/\/+$/, '')}/extract`;
    let response: Response;
    try {
      response = await fetch(endpoint, { method: 'POST', headers, body: file, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      let detail = response.statusText;
      try {
        const errorBody = await response.json();
        detail = String(errorBody.detail || errorBody.message || detail);
      } catch {
        // Keep the HTTP status text when the response is not JSON.
      }
      throw new Error(`HTTP ${response.status}: ${detail}`);
    }

    onProgress?.('parsing_fields', 80, 'Parsing text returned by your API using deterministic field rules...');
    const data = await response.json();
    const rawText = String(data.combined_text || data.raw_text || '');
    if (!rawText.trim()) {
      throw new Error('The API returned no selectable text. This may be a scanned PDF; OCR is not enabled in this Vercel endpoint yet.');
    }

    // The /extract endpoint returns extracted text, not structured fields.
    // Parse only values present in that text; never invent invoice data.
    const invoice = this.parseRawInvoiceText(rawText, file.name);
    const warnings: string[] = [];
    if (data.ocr_required || (Array.isArray(data.pages_requiring_ocr) && data.pages_requiring_ocr.length > 0)) {
      warnings.push('One or more pages may still require OCR. Review extracted values against the PDF.');
    }
    if (!/(?:\bUSD\b|\bEUR\b|\bGBP\b|\bCAD\b|\bAUD\b|\bJPY\b|\bCHF\b|[$€£¥])/i.test(rawText)) {
      warnings.push('Currency was not clearly identified; the review form currently defaults to USD. Confirm the invoice currency.');
    }
    if (rawText.trim().length < 50) warnings.push('Very little readable text was returned. Review the PDF manually.');
    warnings.push('Fields are parsed with deterministic rules; verify results before accounting use.');

    onProgress?.('completed', 100, 'API text extraction completed. Review extracted fields before use.');
    return { invoice, rawExtractedText: rawText, extractionMethod: 'open_invoice_engine_api', isBackendResult: true, warnings };
  }

  /**
   * Deterministic client-side extraction:
   * 1. Reads text stream from digital PDF using pdfjs-dist if available.
   * 2. Runs deterministic regex pattern matching for supplier, invoice number, dates, totals.
   * 3. If no selectable text is found, fails clearly; scanned-PDF OCR is not enabled.
   */
  private static async extractInBrowser(
    file: File,
    onProgress?: ExtractionProgressCallback
  ): Promise<ExtractionResult> {
    onProgress?.('extracting_text', 40, 'Extracting text layer and tokens in browser...');
    
    let rawText = '';
    try {
      rawText = await this.extractTextFromPdfFile(file);
    } catch {
      // PDF text layer could be empty or scanned
      rawText = '';
    }

    if (!rawText.trim()) {
      throw new Error('No selectable text was found in this PDF. Scanned PDFs require OCR, which is not enabled yet. Use a text-based PDF or wait until OCR support is added.');
    }

    onProgress?.('parsing_fields', 70, 'Running deterministic pattern recognition rules...');

    // Parse only values present in the extracted source text.
    const parsed = this.parseRawInvoiceText(rawText, file.name);

    onProgress?.('validating', 90, 'Running mathematical and logical validation engine...');

    return {
      invoice: parsed,
      rawExtractedText: rawText || `[No selectable text found in ${file.name}. Processed via deterministic template heuristics]`,
      extractionMethod: 'deterministic_browser_engine',
      isBackendResult: false,
      warnings: rawText.trim().length < 50 ? ['Very little selectable text was found. Review every extracted field against the original PDF.'] : [],
    };
  }

  /**
   * Uses pdfjs-dist to parse text from digital PDF pages.
   */
  private static async extractTextFromPdfFile(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Dynamically import pdfjs-dist to avoid SSR or worker bundling traps
      const pdfjs = await import('pdfjs-dist');
      // Set worker source to CDN if not already configured
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version || '4.10.38'}/pdf.worker.min.mjs`;
      }

      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';

      for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 5); pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: unknown) => {
            if (typeof item === 'object' && item !== null && 'str' in item) {
              return (item as { str: string }).str;
            }
            return '';
          })
          .join(' ');
        fullText += `--- Page ${pageNum} ---\n` + pageText + '\n\n';
      }

      return fullText;
    } catch (e) {
      console.warn('PDF.js text layer extraction skipped or failed:', e);
      return '';
    }
  }

  /**
   * Deterministic Regex Parser:
   * Extracts invoice number, dates, currency, monetary values, and line items from text.
   */
  public static parseRawInvoiceText(text: string, filename: string): Partial<Invoice> {
    // 1. Currency detection
    let currency: Currency = 'USD';
    if (/\bINR\b/i.test(text) || text.includes('₹')) currency = 'INR';
    else if (text.includes('€') || /\bEUR\b/i.test(text)) currency = 'EUR';
    if (text.includes('€') || /\bEUR\b/i.test(text)) currency = 'EUR';
    else if (text.includes('£') || /\bGBP\b/i.test(text)) currency = 'GBP';
    else if (/\bCAD\b/i.test(text)) currency = 'CAD';
    else if (/\bAUD\b/i.test(text)) currency = 'AUD';
    else if (text.includes('¥') || /\bJPY\b/i.test(text)) currency = 'JPY';
    else if (/\bCHF\b/i.test(text)) currency = 'CHF';

    // 2. Invoice Number
    const invMatch = text.match(/\binvoice\s*(?:number|no\.?|#)\s*[:#.-]?\s*([A-Z0-9][A-Z0-9/_-]{2,30})/i)
      || text.match(/\binvoice\s*(?:#|no\.?|num|number)\s*[:.\s]?\s*([a-z0-9\-_#/]{3,24})/i);
    const invoiceNumber = invMatch ? invMatch[1].trim() : '';

    // 3. Dates: support ISO dates and common US MM/DD/YYYY invoice dates.
    const normalizeDate = (value: string): string => {
      const iso = value.match(/^(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})$/);
      if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
      const us = value.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})$/);
      if (us) return `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`;
      const named = value.match(/^(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})$/i);
      if (named) { const month = ['january','february','march','april','may','june','july','august','september','october','november','december'].indexOf(named[2].toLowerCase()) + 1; return `${named[3]}-${String(month).padStart(2, '0')}-${named[1].padStart(2, '0')}`; }
      return '';
    };
    const datePattern = /\b((?:20\d{2}[-/.](?:0?[1-9]|1[0-2])[-/.](?:0?[1-9]|[12]\d|3[01]))|(?:(?:0?[1-9]|1[0-2])[-/.](?:0?[1-9]|[12]\d|3[01])[-/.]20\d{2})|(?:\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d{2}))/i;
    const dateMatches = text.match(datePattern);
    const invoiceDate = dateMatches ? normalizeDate(dateMatches[1]) : '';

    // Due Date
    const dueDateMatches = text.match(/(?:due\s*date|payment\s*due|due|fälligkeit)\s*[:.\s]?\s*((?:20\d{2}[-/.](?:0?[1-9]|1[0-2])[-/.](?:0?[1-9]|[12]\d|3[01]))|(?:(?:0?[1-9]|1[0-2])[-/.](?:0?[1-9]|[12]\d|3[01])[-/.]20\d{2})|(?:\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d{2}))/i);
    const dueDate = dueDateMatches ? normalizeDate(dueDateMatches[1]) : '';

    // 4. Tax ID / VAT
    const vatMatch = text.match(/\b(?:vat\s*no\.?|tax\s*id|ein|steuernummer|ust-idnr\.?)\s*[:.\s]?\s*([A-Z0-9\-_]{6,20})/i);
    const supplierTaxId = vatMatch ? vatMatch[1].trim() : '';

    // 5. PO Number
    const poMatch = text.match(/(?:po\s*(?:#|no\.?|num|number)|purchase\s*order)\s*[:.\s]?\s*([a-z0-9\-_]{3,20})/i);
    const purchaseOrderNumber = poMatch ? poMatch[1].trim() : '';

    // 6. Monetary amounts via regex
    const findAmount = (patterns: RegExp[]): number => {
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          const clean = match[1].replace(/,/g, '');
          const val = parseFloat(clean);
          if (!isNaN(val)) return val;
        }
      }
      return 0;
    };

    const totalAmount = findAmount([
      /(?:total\s*amount|total\s*due|balance\s*due|gesamtbetrag|amount\s*payable|grand\s*total)\s*[:.\s]?\s*[$€£¥]?\s*([\d,]+\.\d{2})/i,
      /\btotal\b\s*[:.\s]?\s*[$€£¥]?\s*([\d,]+\.\d{2})/i,
    ]) || 0;

    const subtotal = findAmount([
      /(?:subtotal|sub-total|zwischensumme|net\s*amount)\s*[:.\s]?\s*[$€£¥]?\s*([\d,]+\.\d{2})/i,
    ]) || 0;

    const taxAmount = /\b(?:CGST|SGST|IGST)\b/i.test(text)
      ? (findAmount([/CGST\s*\([^)]*\)\s*[$€£¥₹]?\s*([\d,]+\.\d{2})/i]) + findAmount([/SGST\s*\([^)]*\)\s*[$€£¥₹]?\s*([\d,]+\.\d{2})/i]) + findAmount([/IGST\s*\([^)]*\)\s*[$€£¥₹]?\s*([\d,]+\.\d{2})/i]))
      : (findAmount([/(?:total\s+tax|tax\s+amount|tax|vat|mwst|sales\s*tax|gst)\s*[:.\s]?\s*[$€£¥₹]?\s*([\d,]+\.\d{2})/i]) || 0);
      /(?:tax|vat|mwst|sales\s*tax|gst)\s*[:.\s]?\s*[$€£¥]?\s*([\d,]+\.\d{2})/i,
    ]) || 0;

    const shippingAmount = findAmount([
      /(?:shipping|freight|handling|delivery|porto)\s*[:.\s]?\s*[$€£¥]?\s*([\d,]+\.\d{2})/i,
    ]) || 0;

    const discount = findAmount([
      /(?:discount|rabatt|skonto)\s*[:.\s]?\s*[$€£¥]?\s*([\d,]+\.\d{2})/i,
    ]) || 0;

    // Supplier name heuristic: First non-empty lines before "Invoice" or clean filename
    let supplierName = '';
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      const candidate = lines.find(l => l.length > 3 && l.length < 50 && !/page|invoice|rechnung|date|total/i.test(l));
      if (candidate) supplierName = candidate;
    }

    // No itemized rows are fabricated when the source text does not expose them.
    const lineItems: InvoiceLineItem[] = [];

    return {
      supplierName,
      supplierAddress: '',
      supplierTaxId,
      invoiceNumber,
      invoiceDate,
      dueDate,
      purchaseOrderNumber,
      customerName: (() => { const billTo = lines.findIndex(line => /^BILL\\s+TO$/i.test(line)); return billTo >= 0 ? (lines.slice(billTo + 1).find(line => !/^(payment terms|po number|gstin:|currency:)/i.test(line)) || '') : ''; })(),
      paymentTerms: '',
      currency,
      subtotal,
      discount,
      taxAmount,
      shippingAmount,
      totalAmount,
      lineItems,
    };
  }

  /**
   * Live test connection for backend API configuration
   */
  static async testBackendConnection(baseUrl: string, apiKey?: string): Promise<{ success: boolean; message: string; latencyMs: number }> {
    const start = performance.now();
    try {
      const cleanUrl = baseUrl.replace(/\/+$/, '');
      const healthUrl = `${cleanUrl}/health`;

      const headers: Record<string, string> = {};
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
        headers['X-API-Key'] = apiKey;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(healthUrl, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const latencyMs = Math.round(performance.now() - start);

      if (response.ok) {
        return {
          success: true,
          message: `Connected successfully to InvoiceFlow's Vercel extraction API (${latencyMs}ms response time).`,
          latencyMs,
        };
      } else {
        return {
          success: false,
          message: `Endpoint returned HTTP ${response.status} (${response.statusText}). Check backend URL.`,
          latencyMs,
        };
      }
    } catch (e: unknown) {
      const latencyMs = Math.round(performance.now() - start);
      const errMsg = e instanceof Error ? e.message : 'Unknown connection error';
      return {
        success: false,
        message: `Failed to reach InvoiceFlow's Vercel API at ${baseUrl}: ${errMsg}. Check the deployment and API route.`,
        latencyMs,
      };
    }
  }
}
