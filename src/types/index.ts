export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'CHF';

export type InvoiceStatus = 'draft' | 'awaiting_review' | 'reviewed' | 'exported';
export type ValidationStatus = 'validated' | 'warnings' | 'error';
export type ExtractionMethod = 'deterministic_browser_engine' | 'open_invoice_engine_api' | 'demo_sample_record';

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number; // e.g., 0.10 for 10%
  taxAmount?: number;
  lineTotal: number;
}

export interface ValidationRuleViolation {
  code: string;
  field?: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  expectedValue?: string | number;
  actualValue?: string | number;
}

export interface ValidationResult {
  status: ValidationStatus;
  isValid: boolean;
  violations: ValidationRuleViolation[];
  calculatedSubtotal: number;
  calculatedLineItemsSum: number;
  calculatedExpectedTotal: number;
  differenceFromReportedTotal: number;
}

export interface Invoice {
  id: string;
  ownerId: string;
  originalFilename: string;
  fileSize: number;
  fileType: string;
  fileDataUrl?: string; // Blob, signed URL, or base64 data for document viewer
  documentPath?: string; // Private Supabase Storage path for the original PDF
  sampleDocType?: 'acme_cloud' | 'global_logistics' | 'apex_hardware' | 'nordic_design' | 'metropolis_legal';
  
  // Supplier / Vendor
  supplierName: string;
  supplierAddress: string;
  supplierTaxId: string; // Tax ID / VAT / EIN
  supplierEmail?: string;
  supplierPhone?: string;

  // Metadata
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string;     // YYYY-MM-DD
  purchaseOrderNumber: string;
  customerName: string;
  customerAddress?: string;
  customerTaxId?: string;
  paymentTerms: string; // e.g. "Net 30", "Due upon receipt"

  // Financials
  currency: Currency;
  subtotal: number;
  discount: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;

  // Items
  lineItems: InvoiceLineItem[];

  // Extraction & Review state
  extractionMethod: ExtractionMethod;
  extractionStatus: 'processing' | 'completed' | 'failed';
  validationResult: ValidationResult;
  reviewStatus: InvoiceStatus;
  isDuplicateWarning?: boolean;
  notes?: string;

  // Audit timestamps
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  companyName: string;
  role: string;
  plan: 'free_trial' | 'monthly' | 'annual';
  isEmailVerified: boolean;
  createdAt: string;
}

export interface BackendConfig {
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
  useLiveBackend: boolean;
  autoValidateOnExtract: boolean;
  roundingTolerance: number; // default $0.02
}

export interface UsageRecord {
  id: string;
  userId: string;
  operation: 'pdf_extraction' | 'batch_upload' | 'reconciliation_run' | 'csv_export';
  status: 'success' | 'failed' | 'warning';
  itemCount: number;
  details: string;
  timestamp: string;
}

// Reconciliation types
export interface SpreadsheetColumnMapping {
  invoiceNumberCol: string;
  supplierCol: string;
  dateCol: string;
  amountCol: string;
  poNumberCol?: string;
  statusCol?: string;
}

export type ReconciliationMatchStatus = 
  | 'exact_match' 
  | 'probable_match' 
  | 'amount_mismatch' 
  | 'unmatched_spreadsheet' 
  | 'unmatched_invoice';

export interface ReconciliationRowComparison {
  id: string;
  spreadsheetRowIndex: number;
  rawSpreadsheetData: Record<string, string>;
  
  // Normalized spreadsheet fields
  spreadsheetInvoiceNumber: string;
  spreadsheetSupplier: string;
  spreadsheetDate: string;
  spreadsheetAmount: number;

  // Matched invoice (if any)
  matchedInvoiceId?: string;
  matchedInvoice?: Invoice;

  // Match details
  status: ReconciliationMatchStatus;
  confidenceScore: number; // 0 to 100
  matchReasons: string[];
  amountVariance: number; // spreadsheetAmount - invoiceTotal
  userConfirmed: boolean;
  userRejected: boolean;
}

export interface ReconciliationRun {
  id: string;
  ownerId: string;
  spreadsheetName: string;
  totalSpreadsheetRows: number;
  matchedCount: number;
  discrepancyCount: number;
  unmatchedCount: number;
  columnMapping: SpreadsheetColumnMapping;
  comparisons: ReconciliationRowComparison[];
  createdAt: string;
}
