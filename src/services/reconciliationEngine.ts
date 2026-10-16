import Papa from 'papaparse';
import { Invoice, ReconciliationMatchStatus, ReconciliationRowComparison, ReconciliationRun, SpreadsheetColumnMapping } from '../types';

export class ReconciliationEngine {
  /**
   * Parse CSV text into raw structured rows and detected headers
   */
  static parseSpreadsheetData(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
    const result = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: h => h.trim(),
    });

    const headers = result.meta.fields || [];
    const rows = (result.data as Record<string, string>[]).filter(row => {
      // Must contain at least one non-empty value
      return Object.values(row).some(v => v !== undefined && String(v).trim() !== '');
    });

    return { headers, rows };
  }

  /**
   * Auto-detect matching spreadsheet column names using common financial naming conventions
   */
  static autoDetectColumnMapping(headers: string[]): SpreadsheetColumnMapping {
    const findHeader = (candidates: RegExp[]): string => {
      for (const regex of candidates) {
        const found = headers.find(h => regex.test(h));
        if (found) return found;
      }
      return '';
    };

    const invoiceNumberCol = findHeader([
      /^(?:invoice[_\s-]?#|invoice[_\s-]?no|inv[_\s-]?#|invoice[_\s-]?number|rechnungsnummer)$/i,
      /invoice.*(?:#|no|num|id)/i,
      /document.*(?:#|no|number)/i,
    ]) || headers[0] || '';

    const supplierCol = findHeader([
      /^(?:supplier|vendor|payee|merchant|creditor|lieferant|company)$/i,
      /vendor.*name/i,
      /supplier.*name/i,
    ]) || (headers.length > 1 ? headers[1] : '');

    const dateCol = findHeader([
      /^(?:date|invoice[_\s-]?date|doc[_\s-]?date|datum|posted[_\s-]?date)$/i,
      /invoice.*date/i,
      /bill.*date/i,
    ]) || (headers.length > 2 ? headers[2] : '');

    const amountCol = findHeader([
      /^(?:amount|total|invoice[_\s-]?total|grand[_\s-]?total|gross|betrag|balance)$/i,
      /invoice.*amount/i,
      /total.*amount/i,
      /amount.*due/i,
    ]) || (headers.length > 3 ? headers[3] : '');

    const poNumberCol = findHeader([
      /^(?:po|po[_\s-]?#|po[_\s-]?number|purchase[_\s-]?order|order[_\s-]?#)$/i,
      /purchase.*order/i,
    ]);

    const statusCol = findHeader([
      /^(?:status|payment[_\s-]?status|state|approval)$/i,
    ]);

    return {
      invoiceNumberCol,
      supplierCol,
      dateCol,
      amountCol,
      poNumberCol,
      statusCol,
    };
  }

  /**
   * Run transparent deterministic reconciliation between spreadsheet rows and InvoiceFlow database
   */
  static reconcile(
    spreadsheetName: string,
    rows: Record<string, string>[],
    mapping: SpreadsheetColumnMapping,
    invoices: Invoice[],
    ownerId: string
  ): ReconciliationRun {
    const comparisons: ReconciliationRowComparison[] = [];
    const matchedInvoiceIds = new Set<string>();

    const normalize = (val: string = '') => val.toLowerCase().replace(/[^a-z0-9]/g, '');

    rows.forEach((row, idx) => {
      const rawInvNo = (row[mapping.invoiceNumberCol] || '').trim();
      const rawSupplier = (row[mapping.supplierCol] || '').trim();
      const rawDate = (row[mapping.dateCol] || '').trim();
      const rawAmountStr = (row[mapping.amountCol] || '').replace(/[^0-9.-]/g, '');
      const parsedAmount = parseFloat(rawAmountStr) || 0;

      const normInvNo = normalize(rawInvNo);
      const normSupplier = normalize(rawSupplier);

      let bestMatch: Invoice | undefined;
      let status: ReconciliationMatchStatus = 'unmatched_spreadsheet';
      let confidenceScore = 0;
      const matchReasons: string[] = [];
      let amountVariance = 0;

      // 1. Direct Invoice Number exact search
      const invMatches = invoices.filter(inv => normalize(inv.invoiceNumber) === normInvNo && normInvNo.length >= 3);

      if (invMatches.length > 0) {
        // Find best match among matching invoice numbers
        const exactCandidate = invMatches.find(inv => Math.abs(inv.totalAmount - parsedAmount) <= 0.02);
        if (exactCandidate) {
          bestMatch = exactCandidate;
          status = 'exact_match';
          confidenceScore = 100;
          matchReasons.push(`Exact Invoice #${rawInvNo} and matching total amount (${parsedAmount.toFixed(2)})`);
          matchedInvoiceIds.add(bestMatch.id);
        } else {
          // Invoice number matched, but amount differs
          bestMatch = invMatches[0];
          status = 'amount_mismatch';
          confidenceScore = 75;
          amountVariance = Math.round((parsedAmount - bestMatch.totalAmount) * 100) / 100;
          matchReasons.push(`Invoice #${rawInvNo} matched, but ledger says ${parsedAmount.toFixed(2)} while invoice says ${bestMatch.totalAmount.toFixed(2)} (Variance: ${amountVariance > 0 ? '+' : ''}${amountVariance.toFixed(2)})`);
          matchedInvoiceIds.add(bestMatch.id);
        }
      } else {
        // 2. Probable match by Supplier Name & exact Amount
        const supplierMatches = invoices.filter(inv => {
          const normInvSupp = normalize(inv.supplierName);
          const hasSupplierOverlap = normInvSupp.includes(normSupplier) || normSupplier.includes(normInvSupp);
          const matchesAmount = Math.abs(inv.totalAmount - parsedAmount) <= 0.02;
          return hasSupplierOverlap && matchesAmount;
        });

        if (supplierMatches.length > 0) {
          bestMatch = supplierMatches[0];
          status = 'probable_match';
          confidenceScore = 85;
          matchReasons.push(`Probable match: Supplier name and exact amount (${parsedAmount.toFixed(2)}) match, but invoice number differs or is unformatted.`);
          matchedInvoiceIds.add(bestMatch.id);
        } else {
          // Check by date + amount
          const dateMatches = invoices.filter(inv => {
            const matchesAmount = Math.abs(inv.totalAmount - parsedAmount) <= 0.02;
            const matchesDate = inv.invoiceDate && rawDate && (inv.invoiceDate.includes(rawDate) || rawDate.includes(inv.invoiceDate));
            return matchesAmount && matchesDate;
          });

          if (dateMatches.length > 0) {
            bestMatch = dateMatches[0];
            status = 'probable_match';
            confidenceScore = 70;
            matchReasons.push(`Date (${rawDate}) and amount (${parsedAmount.toFixed(2)}) match existing invoice from '${bestMatch.supplierName}'.`);
            matchedInvoiceIds.add(bestMatch.id);
          } else {
            status = 'unmatched_spreadsheet';
            confidenceScore = 0;
            matchReasons.push(`No corresponding invoice found in InvoiceFlow records.`);
          }
        }
      }

      comparisons.push({
        id: `recon_row_${idx}_${Date.now()}`,
        spreadsheetRowIndex: idx + 1,
        rawSpreadsheetData: row,
        spreadsheetInvoiceNumber: rawInvNo,
        spreadsheetSupplier: rawSupplier,
        spreadsheetDate: rawDate,
        spreadsheetAmount: parsedAmount,
        matchedInvoiceId: bestMatch?.id,
        matchedInvoice: bestMatch,
        status,
        confidenceScore,
        matchReasons,
        amountVariance: bestMatch ? Math.round((parsedAmount - bestMatch.totalAmount) * 100) / 100 : 0,
        userConfirmed: status === 'exact_match',
        userRejected: false,
      });
    });

    // Check for unmatched extracted invoices (invoices in DB that weren't found in spreadsheet)
    invoices.forEach((inv, invIdx) => {
      if (!matchedInvoiceIds.has(inv.id)) {
        comparisons.push({
          id: `recon_unmatched_inv_${inv.id}`,
          spreadsheetRowIndex: -1,
          rawSpreadsheetData: {},
          spreadsheetInvoiceNumber: '-',
          spreadsheetSupplier: '-',
          spreadsheetDate: '-',
          spreadsheetAmount: 0,
          matchedInvoiceId: inv.id,
          matchedInvoice: inv,
          status: 'unmatched_invoice',
          confidenceScore: 0,
          matchReasons: [`Invoice #${inv.invoiceNumber} (${inv.supplierName}, ${inv.currency} ${inv.totalAmount.toFixed(2)}) has no matching row in the uploaded spreadsheet.`],
          amountVariance: -inv.totalAmount,
          userConfirmed: false,
          userRejected: false,
        });
      }
    });

    const matchedCount = comparisons.filter(c => c.status === 'exact_match' || c.status === 'probable_match').length;
    const discrepancyCount = comparisons.filter(c => c.status === 'amount_mismatch').length;
    const unmatchedCount = comparisons.filter(c => c.status === 'unmatched_spreadsheet' || c.status === 'unmatched_invoice').length;

    return {
      id: `recon_run_${Date.now()}`,
      ownerId,
      spreadsheetName,
      totalSpreadsheetRows: rows.length,
      matchedCount,
      discrepancyCount,
      unmatchedCount,
      columnMapping: mapping,
      comparisons,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Generates a sample CSV template for testing reconciliation
   */
  static getSampleReconciliationCsv(): string {
    return [
      'Invoice Number,Vendor Name,Invoice Date,Total Amount,PO Number,Payment Status',
      'INV-2024-8842,Acme Cloud Technologies Inc.,2026-09-15,4023.75,PO-99410,Paid',
      'GL-2024-9021,Global Freight & Logistics B.V.,2026-09-28,2060.00,PO-88120,Pending',
      'APX-77291,Apex Industrial Hardware Supplies LLC,2026-10-02,1341.00,PO-99504,Awaiting Approval', // Real subtotal vs invoice discrepancy
      'NOR-2024-089,Nordic Brand & UI Studio ApS,2026-10-08,4500.00,PO-99512,Scheduled',
      'ML-99238,Metropolis Legal & Corporate Counsel LLP,2026-10-12,2880.00,PO-99520,Paid',
      'MISC-2024-001,Unrecorded Office Depot Expense,2026-10-10,345.50,PO-99999,Pending', // Unmatched in DB
    ].join('\n');
  }
}
