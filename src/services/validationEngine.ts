import { Invoice, ValidationResult, ValidationRuleViolation, ValidationStatus } from '../types';

export interface ValidationOptions {
  roundingTolerance?: number; // default $0.02
  existingInvoices?: Invoice[];
  currentInvoiceId?: string;
}

export class DeterministicValidationEngine {
  /**
   * Run all deterministic validation checks on an invoice.
   * AI is NOT required. Pure, transparent, audit-ready math & logic.
   */
  static validate(invoice: Partial<Invoice>, options: ValidationOptions = {}): ValidationResult {
    const violations: ValidationRuleViolation[] = [];
    const tolerance = options.roundingTolerance ?? 0.02;

    const subtotal = Number(invoice.subtotal) || 0;
    const discount = Number(invoice.discount) || 0;
    const tax = Number(invoice.taxAmount) || 0;
    const shipping = Number(invoice.shippingAmount) || 0;
    const reportedTotal = Number(invoice.totalAmount) || 0;

    // 1. Mandatory Critical Fields
    if (!invoice.invoiceNumber || invoice.invoiceNumber.trim() === '') {
      violations.push({
        code: 'MISSING_INVOICE_NUMBER',
        field: 'invoiceNumber',
        severity: 'error',
        message: 'Invoice number is required for accounting and tax records.',
      });
    }

    if (!invoice.supplierName || invoice.supplierName.trim() === '') {
      violations.push({
        code: 'MISSING_SUPPLIER_NAME',
        field: 'supplierName',
        severity: 'error',
        message: 'Supplier/vendor name is missing from the extraction.',
      });
    }

    if (!invoice.invoiceDate || invoice.invoiceDate.trim() === '') {
      violations.push({
        code: 'MISSING_INVOICE_DATE',
        field: 'invoiceDate',
        severity: 'error',
        message: 'Invoice date is missing or could not be recognized.',
      });
    }

    if (!invoice.currency) {
      violations.push({
        code: 'MISSING_CURRENCY',
        field: 'currency',
        severity: 'error',
        message: 'Currency symbol or ISO code was not detected.',
      });
    }

    if (reportedTotal <= 0 && (!invoice.lineItems || invoice.lineItems.length === 0)) {
      violations.push({
        code: 'ZERO_OR_MISSING_TOTAL',
        field: 'totalAmount',
        severity: 'error',
        message: 'Total amount is zero or not specified.',
        actualValue: reportedTotal,
      });
    }

    // 2. Date Logic & Format Checks
    if (invoice.invoiceDate) {
      const invoiceDateObj = new Date(invoice.invoiceDate);
      if (isNaN(invoiceDateObj.getTime())) {
        violations.push({
          code: 'INVALID_INVOICE_DATE_FORMAT',
          field: 'invoiceDate',
          severity: 'error',
          message: `Invoice date '${invoice.invoiceDate}' is not a valid ISO date.`,
        });
      } else {
        // Warning if invoice date is far in the future
        const now = new Date();
        const oneYearFuture = new Date();
        oneYearFuture.setFullYear(now.getFullYear() + 1);
        if (invoiceDateObj > oneYearFuture) {
          violations.push({
            code: 'DATE_FAR_FUTURE',
            field: 'invoiceDate',
            severity: 'warning',
            message: 'Invoice date is more than 1 year in the future.',
            actualValue: invoice.invoiceDate,
          });
        }
      }

      if (invoice.dueDate) {
        const dueDateObj = new Date(invoice.dueDate);
        if (isNaN(dueDateObj.getTime())) {
          violations.push({
            code: 'INVALID_DUE_DATE_FORMAT',
            field: 'dueDate',
            severity: 'warning',
            message: `Due date '${invoice.dueDate}' is invalid.`,
          });
        } else if (invoiceDateObj && !isNaN(invoiceDateObj.getTime())) {
          if (dueDateObj < invoiceDateObj) {
            violations.push({
              code: 'DUE_DATE_BEFORE_INVOICE_DATE',
              field: 'dueDate',
              severity: 'warning',
              message: 'Due date is earlier than the invoice issuance date.',
              expectedValue: `>= ${invoice.invoiceDate}`,
              actualValue: invoice.dueDate,
            });
          }
        }
      }
    }

    // 3. Negative Amounts (except discount which could be reported positive or negative)
    if (subtotal < 0) {
      violations.push({
        code: 'NEGATIVE_SUBTOTAL',
        field: 'subtotal',
        severity: 'error',
        message: 'Subtotal cannot be a negative value.',
        actualValue: subtotal,
      });
    }

    if (tax < 0) {
      violations.push({
        code: 'NEGATIVE_TAX',
        field: 'taxAmount',
        severity: 'error',
        message: 'Tax amount cannot be negative.',
        actualValue: tax,
      });
    }

    if (shipping < 0) {
      violations.push({
        code: 'NEGATIVE_SHIPPING',
        field: 'shippingAmount',
        severity: 'error',
        message: 'Shipping or surcharge cannot be negative.',
        actualValue: shipping,
      });
    }

    // 4. Mathematical Formula Check: Subtotal - Discount + Tax + Shipping == Total
    // Calculated expected total:
    const expectedTotal = Math.round((subtotal - discount + tax + shipping) * 100) / 100;
    const diffFromReported = Math.round((reportedTotal - expectedTotal) * 100) / 100;

    if (Math.abs(diffFromReported) > tolerance) {
      violations.push({
        code: 'TOTAL_BALANCE_MISMATCH',
        field: 'totalAmount',
        severity: 'error',
        message: `Sum mismatch: Subtotal (${subtotal.toFixed(2)}) - Discount (${discount.toFixed(2)}) + Tax (${tax.toFixed(2)}) + Shipping (${shipping.toFixed(2)}) = ${expectedTotal.toFixed(2)}, but reported total is ${reportedTotal.toFixed(2)}. (Difference: ${diffFromReported > 0 ? '+' : ''}${diffFromReported.toFixed(2)})`,
        expectedValue: expectedTotal,
        actualValue: reportedTotal,
      });
    }

    // 5. Line items consistency check
    let lineItemsSum = 0;
    if (invoice.lineItems && invoice.lineItems.length > 0) {
      for (let i = 0; i < invoice.lineItems.length; i++) {
        const item = invoice.lineItems[i];
        const calculatedRow = Math.round((item.quantity * item.unitPrice) * 100) / 100;
        lineItemsSum += item.lineTotal;

        // Check each line row math
        if (item.quantity > 0 && item.unitPrice > 0) {
          const rowDiff = Math.abs(item.lineTotal - calculatedRow);
          if (rowDiff > tolerance) {
            violations.push({
              code: 'LINE_ITEM_MATH_MISMATCH',
              field: `lineItems[${i}].lineTotal`,
              severity: 'warning',
              message: `Line #${i + 1} ('${item.description.slice(0, 30)}'): Qty (${item.quantity}) × Unit (${item.unitPrice.toFixed(2)}) = ${calculatedRow.toFixed(2)}, but line total is ${item.lineTotal.toFixed(2)}.`,
              expectedValue: calculatedRow,
              actualValue: item.lineTotal,
            });
          }
        }
      }

      lineItemsSum = Math.round(lineItemsSum * 100) / 100;
      // If subtotal is present, check if sum of lines equals subtotal
      if (subtotal > 0) {
        const lineToSubtotalDiff = Math.abs(lineItemsSum - subtotal);
        if (lineToSubtotalDiff > tolerance) {
          violations.push({
            code: 'LINE_ITEMS_SUBTOTAL_MISMATCH',
            field: 'subtotal',
            severity: 'warning',
            message: `Sum of line items (${lineItemsSum.toFixed(2)}) differs from extracted subtotal (${subtotal.toFixed(2)}) by ${lineToSubtotalDiff.toFixed(2)}.`,
            expectedValue: lineItemsSum,
            actualValue: subtotal,
          });
        }
      }
    } else {
      violations.push({
        code: 'NO_LINE_ITEMS',
        field: 'lineItems',
        severity: 'info',
        message: 'No itemized line rows were extracted. Invoice only has summary totals.',
      });
    }

    // 6. Tax ID & PO Warnings (Best practices for accounts payable)
    if (!invoice.supplierTaxId || invoice.supplierTaxId.trim() === '') {
      violations.push({
        code: 'MISSING_TAX_ID',
        field: 'supplierTaxId',
        severity: 'warning',
        message: 'Supplier Tax ID / VAT / EIN is not identified. Required for B2B tax audits in most jurisdictions.',
      });
    }

    if (!invoice.purchaseOrderNumber || invoice.purchaseOrderNumber.trim() === '') {
      violations.push({
        code: 'MISSING_PO_NUMBER',
        field: 'purchaseOrderNumber',
        severity: 'info',
        message: 'No Purchase Order (PO) number reference found on invoice.',
      });
    }

    // 7. Duplicate Invoice Detection
    if (options.existingInvoices && invoice.invoiceNumber && invoice.supplierName) {
      const normalizedInv = invoice.invoiceNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normalizedSupplier = invoice.supplierName.toLowerCase().trim();

      const duplicate = options.existingInvoices.find(other => {
        if (options.currentInvoiceId && other.id === options.currentInvoiceId) return false;
        const otherNormInv = other.invoiceNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
        const otherSupplier = other.supplierName.toLowerCase().trim();
        return otherNormInv === normalizedInv && (otherSupplier.includes(normalizedSupplier) || normalizedSupplier.includes(otherSupplier));
      });

      if (duplicate) {
        violations.push({
          code: 'POTENTIAL_DUPLICATE_INVOICE',
          field: 'invoiceNumber',
          severity: 'error',
          message: `Potential duplicate: Invoice #${invoice.invoiceNumber} from '${invoice.supplierName}' already exists in your records (ID: ${duplicate.id.slice(0, 8)}, uploaded ${new Date(duplicate.createdAt).toLocaleDateString()}).`,
        });
      }
    }

    // Determine final status
    const hasErrors = violations.some(v => v.severity === 'error');
    const hasWarnings = violations.some(v => v.severity === 'warning');

    let status: ValidationStatus = 'validated';
    if (hasErrors) {
      status = 'error';
    } else if (hasWarnings) {
      status = 'warnings';
    }

    return {
      status,
      isValid: !hasErrors,
      violations,
      calculatedSubtotal: subtotal,
      calculatedLineItemsSum: lineItemsSum,
      calculatedExpectedTotal: expectedTotal,
      differenceFromReportedTotal: diffFromReported,
    };
  }
}
