import Papa from 'papaparse';
import { Invoice, ReconciliationRun } from '../types';

export class ExportService {
  /**
   * Helper to trigger native browser file download
   */
  private static triggerDownload(content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;') {
    // Add UTF-8 BOM so Excel opens special characters and symbols cleanly
    const blob = new Blob(['\uFEFF' + content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export flat invoice summary records to CSV
   */
  static exportInvoicesToCsv(invoices: Invoice[], filenamePrefix: string = 'invoices_export'): void {
    const rows = invoices.map(inv => ({
      'Invoice ID': inv.id,
      'Invoice Number': inv.invoiceNumber,
      'Supplier / Vendor': inv.supplierName,
      'Supplier Address': inv.supplierAddress,
      'Supplier Tax ID': inv.supplierTaxId || '',
      'Customer Name': inv.customerName,
      'Invoice Date': inv.invoiceDate,
      'Due Date': inv.dueDate,
      'PO Number': inv.purchaseOrderNumber || '',
      'Payment Terms': inv.paymentTerms,
      'Currency': inv.currency,
      'Subtotal': inv.subtotal.toFixed(2),
      'Discount': inv.discount.toFixed(2),
      'Tax Amount': inv.taxAmount.toFixed(2),
      'Shipping': inv.shippingAmount.toFixed(2),
      'Total Amount': inv.totalAmount.toFixed(2),
      'Validation Status': inv.validationResult.status.toUpperCase(),
      'Review Status': inv.reviewStatus.toUpperCase(),
      'Validation Issues Count': inv.validationResult.violations.length,
      'Extraction Method': inv.extractionMethod,
      'Original File': inv.originalFilename,
      'Created Date': inv.createdAt,
    }));

    const csv = Papa.unparse(rows);
    const dateStr = new Date().toISOString().split('T')[0];
    this.triggerDownload(csv, `${filenamePrefix}_${dateStr}.csv`);
  }

  /**
   * Export detailed invoice records with itemized line items
   */
  static exportDetailedInvoicesWithLineItemsToCsv(invoices: Invoice[]): void {
    const rows: Record<string, string | number>[] = [];

    invoices.forEach(inv => {
      if (!inv.lineItems || inv.lineItems.length === 0) {
        rows.push({
          'Invoice Number': inv.invoiceNumber,
          'Supplier': inv.supplierName,
          'Date': inv.invoiceDate,
          'Currency': inv.currency,
          'Invoice Total': inv.totalAmount.toFixed(2),
          'Line Item #': 1,
          'Line Description': '(Summary Total Only)',
          'Line Qty': 1,
          'Line Unit Price': inv.subtotal.toFixed(2),
          'Line Tax': inv.taxAmount.toFixed(2),
          'Line Total': inv.totalAmount.toFixed(2),
          'Validation Status': inv.validationResult.status,
        });
      } else {
        inv.lineItems.forEach((li, idx) => {
          rows.push({
            'Invoice Number': inv.invoiceNumber,
            'Supplier': inv.supplierName,
            'Date': inv.invoiceDate,
            'Currency': inv.currency,
            'Invoice Total': inv.totalAmount.toFixed(2),
            'Line Item #': idx + 1,
            'Line Description': li.description,
            'Line Qty': li.quantity,
            'Line Unit Price': li.unitPrice.toFixed(2),
            'Line Tax': li.taxAmount ? li.taxAmount.toFixed(2) : '0.00',
            'Line Total': li.lineTotal.toFixed(2),
            'Validation Status': inv.validationResult.status,
          });
        });
      }
    });

    const csv = Papa.unparse(rows);
    const dateStr = new Date().toISOString().split('T')[0];
    this.triggerDownload(csv, `detailed_invoice_line_items_${dateStr}.csv`);
  }

  /**
   * Export reconciliation comparison run report to CSV
   */
  static exportReconciliationReportToCsv(run: ReconciliationRun): void {
    const rows = run.comparisons.map(c => ({
      'Row #': c.spreadsheetRowIndex > 0 ? c.spreadsheetRowIndex : 'N/A (Invoice in DB)',
      'Match Status': c.status.toUpperCase(),
      'Confidence %': c.confidenceScore,
      'User Confirmed': c.userConfirmed ? 'YES' : c.userRejected ? 'REJECTED' : 'PENDING',
      'Spreadsheet Invoice #': c.spreadsheetInvoiceNumber,
      'Spreadsheet Vendor': c.spreadsheetSupplier,
      'Spreadsheet Date': c.spreadsheetDate,
      'Spreadsheet Amount': c.spreadsheetAmount.toFixed(2),
      'Matched DB Invoice #': c.matchedInvoice?.invoiceNumber || 'None',
      'Matched DB Vendor': c.matchedInvoice?.supplierName || 'None',
      'Matched DB Total': c.matchedInvoice ? c.matchedInvoice.totalAmount.toFixed(2) : '0.00',
      'Amount Variance': c.amountVariance.toFixed(2),
      'Match Reason / Audit Note': c.matchReasons.join(' | '),
    }));

    const csv = Papa.unparse(rows);
    const dateStr = new Date().toISOString().split('T')[0];
    this.triggerDownload(csv, `reconciliation_report_${run.spreadsheetName.replace(/\.[^/.]+$/, '')}_${dateStr}.csv`);
  }

  /**
   * Export invoices to JSON for programmatic workflows
   */
  static exportInvoicesToJson(invoices: Invoice[]): void {
    const jsonStr = JSON.stringify(invoices, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];
    this.triggerDownload(jsonStr, `invoices_export_${dateStr}.json`, 'application/json;charset=utf-8;');
  }
}
