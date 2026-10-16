import { BackendConfig, Invoice, ReconciliationRun, UsageRecord, User } from '../types';
import { DeterministicValidationEngine } from './validationEngine';

const STORAGE_KEYS = {
  CURRENT_USER: 'invoiceflow_current_user',
  USERS: 'invoiceflow_users',
  INVOICES_PREFIX: 'invoiceflow_invoices_',
  RECONCILIATION_PREFIX: 'invoiceflow_reconciliations_',
  USAGE_PREFIX: 'invoiceflow_usage_',
  BACKEND_CONFIG: 'invoiceflow_backend_config',
};

const DEFAULT_CONFIG: BackendConfig = {
  baseUrl: '/api',
  apiKey: '',
  timeoutMs: 30000,
  useLiveBackend: true,
  autoValidateOnExtract: true,
  roundingTolerance: 0.02,
};

// Realistic Seed Invoices for initial experience and demo mode testing
export const INITIAL_DEMO_INVOICES: Omit<Invoice, 'ownerId'>[] = [
  {
    id: 'inv_demo_101',
    originalFilename: 'Acme-Cloud-INV-2024-8842.pdf',
    fileSize: 142850,
    fileType: 'application/pdf',
    sampleDocType: 'acme_cloud',
    supplierName: 'Acme Cloud Technologies Inc.',
    supplierAddress: '550 Mission St, Suite 1800, San Francisco, CA 94105, USA',
    supplierTaxId: 'US-EIN-84-2910394',
    supplierEmail: 'billing@acmecloud.io',
    supplierPhone: '+1 (415) 555-0198',
    invoiceNumber: 'INV-2024-8842',
    invoiceDate: '2026-09-15',
    dueDate: '2026-10-15',
    purchaseOrderNumber: 'PO-99410',
    customerName: 'Meridian Capital Partners',
    customerAddress: '100 Wall Street, 24th Fl, New York, NY 10005',
    customerTaxId: 'US-EIN-13-4491029',
    paymentTerms: 'Net 30',
    currency: 'USD',
    subtotal: 3850.00,
    discount: 150.00,
    taxAmount: 323.75, // 8.75% tax on taxable subtotal
    shippingAmount: 0.00,
    totalAmount: 4023.75,
    extractionMethod: 'deterministic_browser_engine',
    extractionStatus: 'completed',
    reviewStatus: 'reviewed',
    lineItems: [
      {
        id: 'li_101_1',
        invoiceId: 'inv_demo_101',
        description: 'Enterprise Dedicated Kubernetes Cluster (Compute Node A)',
        quantity: 1,
        unitPrice: 2200.00,
        taxRate: 0.0875,
        taxAmount: 192.50,
        lineTotal: 2200.00,
      },
      {
        id: 'li_101_2',
        invoiceId: 'inv_demo_101',
        description: 'Multi-Region High Availability Storage Pool (50 TB SSD)',
        quantity: 1,
        unitPrice: 1100.00,
        taxRate: 0.0875,
        taxAmount: 96.25,
        lineTotal: 1100.00,
      },
      {
        id: 'li_101_3',
        invoiceId: 'inv_demo_101',
        description: 'Cloudflare Magic Transit & DDoS Shield Addon',
        quantity: 1,
        unitPrice: 550.00,
        taxRate: 0.0875,
        taxAmount: 48.13,
        lineTotal: 550.00,
      },
    ],
    validationResult: {
      status: 'validated',
      isValid: true,
      violations: [],
      calculatedSubtotal: 3850.00,
      calculatedLineItemsSum: 3850.00,
      calculatedExpectedTotal: 4023.75,
      differenceFromReportedTotal: 0,
    },
    createdAt: '2026-09-16T14:20:00Z',
    updatedAt: '2026-09-17T09:12:00Z',
    reviewedAt: '2026-09-17T09:12:00Z',
  },
  {
    id: 'inv_demo_102',
    originalFilename: 'Global-Logistics-Freight-GL9021.pdf',
    fileSize: 98400,
    fileType: 'application/pdf',
    sampleDocType: 'global_logistics',
    supplierName: 'Global Freight & Logistics B.V.',
    supplierAddress: 'Havenlaan 42, 3011 Rotterdam, Netherlands',
    supplierTaxId: 'NL884920194B01',
    supplierEmail: 'invoices@globalfreight.eu',
    supplierPhone: '+31 10 555 4910',
    invoiceNumber: 'GL-2024-9021',
    invoiceDate: '2026-09-28',
    dueDate: '2026-10-28',
    purchaseOrderNumber: 'PO-88120',
    customerName: 'Meridian Capital Partners',
    customerAddress: '100 Wall Street, 24th Fl, New York, NY 10005',
    paymentTerms: 'Net 30',
    currency: 'EUR',
    subtotal: 1840.00,
    discount: 0.00,
    taxAmount: 0.00, // Reverse charge 0% VAT international freight
    shippingAmount: 220.00, // Fuel bunker surcharge
    totalAmount: 2060.00,
    extractionMethod: 'deterministic_browser_engine',
    extractionStatus: 'completed',
    reviewStatus: 'awaiting_review',
    lineItems: [
      {
        id: 'li_102_1',
        invoiceId: 'inv_demo_102',
        description: 'Ocean Container FCL 40ft (Rotterdam -> Newark Port)',
        quantity: 1,
        unitPrice: 1540.00,
        taxRate: 0,
        taxAmount: 0,
        lineTotal: 1540.00,
      },
      {
        id: 'li_102_2',
        invoiceId: 'inv_demo_102',
        description: 'Customs Clearance & Port Terminal Handling Fees',
        quantity: 1,
        unitPrice: 300.00,
        taxRate: 0,
        taxAmount: 0,
        lineTotal: 300.00,
      },
    ],
    validationResult: {
      status: 'validated',
      isValid: true,
      violations: [],
      calculatedSubtotal: 1840.00,
      calculatedLineItemsSum: 1840.00,
      calculatedExpectedTotal: 2060.00,
      differenceFromReportedTotal: 0,
    },
    createdAt: '2026-09-29T11:05:00Z',
    updatedAt: '2026-09-29T11:05:00Z',
  },
  {
    id: 'inv_demo_103',
    originalFilename: 'Apex-Hardware-Supply-7729.pdf',
    fileSize: 112300,
    fileType: 'application/pdf',
    sampleDocType: 'apex_hardware',
    supplierName: 'Apex Industrial Hardware Supplies LLC',
    supplierAddress: '1200 Industrial Pkwy, Cleveland, OH 44135, USA',
    supplierTaxId: 'US-EIN-34-1192830',
    supplierEmail: 'ar@apexsupply.com',
    supplierPhone: '+1 (216) 555-8832',
    invoiceNumber: 'APX-77291',
    invoiceDate: '2026-10-02',
    dueDate: '2026-10-16',
    purchaseOrderNumber: 'PO-99504',
    customerName: 'Meridian Capital Partners',
    customerAddress: '100 Wall Street, New York, NY 10005',
    paymentTerms: '2/10 Net 30',
    currency: 'USD',
    subtotal: 1250.00,
    discount: 50.00,
    taxAmount: 96.00,
    shippingAmount: 45.00,
    totalAmount: 1395.00, // Mathematical error deliberately injected in raw invoice to test validation engine!
    // Real math: 1250 - 50 + 96 + 45 = 1341.00. But invoice states 1395.00 ($54 discrepancy)
    extractionMethod: 'deterministic_browser_engine',
    extractionStatus: 'completed',
    reviewStatus: 'awaiting_review',
    lineItems: [
      {
        id: 'li_103_1',
        invoiceId: 'inv_demo_103',
        description: 'Server Rack Mount Kits (42U Heavy Duty Steel)',
        quantity: 5,
        unitPrice: 150.00,
        taxRate: 0.08,
        taxAmount: 60.00,
        lineTotal: 750.00,
      },
      {
        id: 'li_103_2',
        invoiceId: 'inv_demo_103',
        description: 'Cat6A Shielded Patch Cable Bundles 100-Pack',
        quantity: 10,
        unitPrice: 50.00,
        taxRate: 0.08,
        taxAmount: 36.00,
        lineTotal: 500.00,
      },
    ],
    validationResult: {
      status: 'error',
      isValid: false,
      violations: [
        {
          code: 'TOTAL_BALANCE_MISMATCH',
          field: 'totalAmount',
          severity: 'error',
          message: 'Sum mismatch: Subtotal (1250.00) - Discount (50.00) + Tax (96.00) + Shipping (45.00) = 1341.00, but reported total is 1395.00. (Difference: +54.00)',
          expectedValue: 1341.00,
          actualValue: 1395.00,
        },
      ],
      calculatedSubtotal: 1250.00,
      calculatedLineItemsSum: 1250.00,
      calculatedExpectedTotal: 1341.00,
      differenceFromReportedTotal: 54.00,
    },
    notes: 'Validation alert: The supplier printed a total of $1,395.00, but itemized line sum + tax + shipping balances to $1,341.00.',
    createdAt: '2026-10-03T16:45:00Z',
    updatedAt: '2026-10-03T16:45:00Z',
  },
  {
    id: 'inv_demo_104',
    originalFilename: 'Nordic-Studio-Design-2024-089.pdf',
    fileSize: 85200,
    fileType: 'application/pdf',
    sampleDocType: 'nordic_design',
    supplierName: 'Nordic Brand & UI Studio ApS',
    supplierAddress: 'Vesterbrogade 14, 1620 Copenhagen, Denmark',
    supplierTaxId: 'DK39281740',
    supplierEmail: 'finance@nordicstudio.dk',
    invoiceNumber: 'NOR-2024-089',
    invoiceDate: '2026-10-08',
    dueDate: '2026-11-08',
    purchaseOrderNumber: '',
    customerName: 'Meridian Capital Partners',
    paymentTerms: 'Net 30',
    currency: 'EUR',
    subtotal: 4500.00,
    discount: 0.00,
    taxAmount: 0.00,
    shippingAmount: 0.00,
    totalAmount: 4500.00,
    extractionMethod: 'deterministic_browser_engine',
    extractionStatus: 'completed',
    reviewStatus: 'awaiting_review',
    lineItems: [
      {
        id: 'li_104_1',
        invoiceId: 'inv_demo_104',
        description: 'Design System & Component Library Sprint Phase 2',
        quantity: 1,
        unitPrice: 4500.00,
        lineTotal: 4500.00,
      },
    ],
    validationResult: {
      status: 'warnings',
      isValid: true,
      violations: [
        {
          code: 'MISSING_PO_NUMBER',
          field: 'purchaseOrderNumber',
          severity: 'info',
          message: 'No Purchase Order (PO) number reference found on invoice.',
        },
      ],
      calculatedSubtotal: 4500.00,
      calculatedLineItemsSum: 4500.00,
      calculatedExpectedTotal: 4500.00,
      differenceFromReportedTotal: 0,
    },
    createdAt: '2026-10-09T08:30:00Z',
    updatedAt: '2026-10-09T08:30:00Z',
  },
  {
    id: 'inv_demo_105',
    originalFilename: 'Metropolis-Legal-Counsel-OCT24.pdf',
    fileSize: 134100,
    fileType: 'application/pdf',
    sampleDocType: 'metropolis_legal',
    supplierName: 'Metropolis Legal & Corporate Counsel LLP',
    supplierAddress: '125 Old Broad Street, London EC2N 1AR, United Kingdom',
    supplierTaxId: 'GB-VAT-992-1049-33',
    supplierEmail: 'accounts@metropolislegal.co.uk',
    invoiceNumber: 'ML-99238',
    invoiceDate: '2026-10-12',
    dueDate: '2026-10-26',
    purchaseOrderNumber: 'PO-99520',
    customerName: 'Meridian Capital Partners',
    paymentTerms: '14 Days',
    currency: 'GBP',
    subtotal: 2400.00,
    discount: 0.00,
    taxAmount: 480.00, // 20% UK VAT
    shippingAmount: 0.00,
    totalAmount: 2880.00,
    extractionMethod: 'deterministic_browser_engine',
    extractionStatus: 'completed',
    reviewStatus: 'reviewed',
    lineItems: [
      {
        id: 'li_105_1',
        invoiceId: 'inv_demo_105',
        description: 'Cross-Border SaaS IP & Data Protection Regulatory Advisory',
        quantity: 8,
        unitPrice: 300.00,
        taxRate: 0.20,
        taxAmount: 480.00,
        lineTotal: 2400.00,
      },
    ],
    validationResult: {
      status: 'validated',
      isValid: true,
      violations: [],
      calculatedSubtotal: 2400.00,
      calculatedLineItemsSum: 2400.00,
      calculatedExpectedTotal: 2880.00,
      differenceFromReportedTotal: 0,
    },
    createdAt: '2026-10-13T10:15:00Z',
    updatedAt: '2026-10-14T15:00:00Z',
    reviewedAt: '2026-10-14T15:00:00Z',
  },
];

export const DEMO_USER: User = {
  id: 'usr_demo_accounting',
  name: 'Sarah Jenkins, CPA',
  email: 'sarah.jenkins@meridiancap.com',
  companyName: 'Meridian Capital Partners',
  role: 'Senior Controller / Accounts Payable',
  plan: 'monthly',
  isEmailVerified: true,
  createdAt: '2026-08-01T00:00:00Z',
};

class StorageService {
  private listeners: (() => void)[] = [];

  subscribe(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  // --- Auth / User Management ---
  getCurrentUser(): User | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      // Ensure seed records exist for this user if first time
      this.ensureSeedDataForUser(user.id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    this.notify();
  }

  loginAsDemoUser(): User {
    const user = { ...DEMO_USER };
    this.setCurrentUser(user);
    return user;
  }

  signUp(name: string, email: string, companyName: string, plan: 'free_trial' | 'monthly' | 'annual' = 'free_trial'): User {
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name,
      email,
      companyName: companyName || 'My Organization',
      role: 'Finance Specialist',
      plan,
      isEmailVerified: false,
      createdAt: new Date().toISOString(),
    };
    this.setCurrentUser(newUser);
    return newUser;
  }

  updateUserProfile(updates: Partial<User>) {
    const current = this.getCurrentUser();
    if (!current) return;
    const updated = { ...current, ...updates };
    this.setCurrentUser(updated);
  }

  verifyCurrentUserEmail() {
    const current = this.getCurrentUser();
    if (current) {
      this.updateUserProfile({ isEmailVerified: true });
    }
  }

  // --- Invoices (Isolated per User) ---
  private getInvoicesKey(userId: string): string {
    return `${STORAGE_KEYS.INVOICES_PREFIX}${userId}`;
  }

  getInvoices(userId?: string): Invoice[] {
    const uid = userId || this.getCurrentUser()?.id;
    if (!uid) return [];
    const raw = localStorage.getItem(this.getInvoicesKey(uid));
    if (!raw) {
      return this.ensureSeedDataForUser(uid);
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private ensureSeedDataForUser(userId: string): Invoice[] {
    const key = this.getInvoicesKey(userId);
    const existing = localStorage.getItem(key);
    if (existing) {
      try {
        return JSON.parse(existing);
      } catch {
        // continue
      }
    }
    // Seed user with demo invoices for quick testing
    const seeded: Invoice[] = INITIAL_DEMO_INVOICES.map(inv => ({
      ...inv,
      ownerId: userId,
    }));
    localStorage.setItem(key, JSON.stringify(seeded));
    return seeded;
  }

  saveInvoice(invoice: Invoice): Invoice {
    const userId = invoice.ownerId || this.getCurrentUser()?.id;
    if (!userId) throw new Error('User not authenticated');

    // Run deterministic validation engine to ensure integrity
    const existing = this.getInvoices(userId);
    const validationResult = DeterministicValidationEngine.validate(invoice, {
      existingInvoices: existing,
      currentInvoiceId: invoice.id,
      roundingTolerance: this.getBackendConfig().roundingTolerance,
    });

    const updatedInvoice: Invoice = {
      ...invoice,
      ownerId: userId,
      validationResult,
      updatedAt: new Date().toISOString(),
    };

    const index = existing.findIndex(inv => inv.id === invoice.id);
    let next: Invoice[];
    if (index >= 0) {
      next = [...existing];
      next[index] = updatedInvoice;
    } else {
      next = [updatedInvoice, ...existing];
    }

    localStorage.setItem(this.getInvoicesKey(userId), JSON.stringify(next));
    this.notify();
    return updatedInvoice;
  }

  saveBatchInvoices(invoices: Invoice[]): Invoice[] {
    const userId = this.getCurrentUser()?.id;
    if (!userId) throw new Error('User not authenticated');

    const existing = this.getInvoices(userId);
    const saved: Invoice[] = [];

    for (const inv of invoices) {
      const validationResult = DeterministicValidationEngine.validate(inv, {
        existingInvoices: [...existing, ...saved],
        currentInvoiceId: inv.id,
        roundingTolerance: this.getBackendConfig().roundingTolerance,
      });

      saved.push({
        ...inv,
        ownerId: userId,
        validationResult,
        createdAt: inv.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const merged = [...saved, ...existing.filter(e => !saved.some(s => s.id === e.id))];
    localStorage.setItem(this.getInvoicesKey(userId), JSON.stringify(merged));
    
    this.recordUsage({
      operation: 'batch_upload',
      status: 'success',
      itemCount: invoices.length,
      details: `Processed batch of ${invoices.length} invoices.`,
    });

    this.notify();
    return saved;
  }

  getInvoiceById(id: string): Invoice | undefined {
    const invoices = this.getInvoices();
    return invoices.find(inv => inv.id === id);
  }

  deleteInvoice(id: string) {
    const userId = this.getCurrentUser()?.id;
    if (!userId) return;
    const existing = this.getInvoices(userId);
    const filtered = existing.filter(inv => inv.id !== id);
    localStorage.setItem(this.getInvoicesKey(userId), JSON.stringify(filtered));
    this.notify();
  }

  resetToDemoSeed(userId?: string) {
    const uid = userId || this.getCurrentUser()?.id;
    if (!uid) return;
    localStorage.removeItem(this.getInvoicesKey(uid));
    this.ensureSeedDataForUser(uid);
    this.notify();
  }

  // --- Reconciliation History ---
  getReconciliations(userId?: string): ReconciliationRun[] {
    const uid = userId || this.getCurrentUser()?.id;
    if (!uid) return [];
    const raw = localStorage.getItem(`${STORAGE_KEYS.RECONCILIATION_PREFIX}${uid}`);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  saveReconciliation(run: ReconciliationRun) {
    const userId = run.ownerId || this.getCurrentUser()?.id;
    if (!userId) return;
    const existing = this.getReconciliations(userId);
    const updated = [run, ...existing.filter(r => r.id !== run.id)];
    localStorage.setItem(`${STORAGE_KEYS.RECONCILIATION_PREFIX}${userId}`, JSON.stringify(updated));
    this.notify();
  }

  // --- Backend Configuration ---
  getBackendConfig(): BackendConfig {
    const raw = localStorage.getItem(STORAGE_KEYS.BACKEND_CONFIG);
    if (!raw) return DEFAULT_CONFIG;
    try {
      const saved = JSON.parse(raw) as Partial<BackendConfig>;
      // Migrate older localhost or external-host configurations to the same-origin Vercel API.
      if (
        (saved.baseUrl === 'http://localhost:8000' || saved.baseUrl?.includes('onrender.com')) &&
        localStorage.getItem('invoiceflow_api_default_migrated') !== 'true'
      ) {
        const migrated = { ...DEFAULT_CONFIG, ...saved, baseUrl: DEFAULT_CONFIG.baseUrl, apiKey: '', useLiveBackend: true };
        localStorage.setItem(STORAGE_KEYS.BACKEND_CONFIG, JSON.stringify(migrated));
        localStorage.setItem('invoiceflow_api_default_migrated', 'true');
        return migrated;
      }
      return { ...DEFAULT_CONFIG, ...saved };
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  saveBackendConfig(config: Partial<BackendConfig>) {
    const current = this.getBackendConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(STORAGE_KEYS.BACKEND_CONFIG, JSON.stringify(updated));
    localStorage.setItem('invoiceflow_api_default_migrated', 'true');
    this.notify();
    return updated;
  }

  // --- Usage Records ---
  recordUsage(params: Omit<UsageRecord, 'id' | 'userId' | 'timestamp'>) {
    const user = this.getCurrentUser();
    if (!user) return;
    const record: UsageRecord = {
      ...params,
      id: `usg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: user.id,
      timestamp: new Date().toISOString(),
    };
    const key = `${STORAGE_KEYS.USAGE_PREFIX}${user.id}`;
    const existing: UsageRecord[] = (() => {
      const raw = localStorage.getItem(key);
      try {
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    })();
    localStorage.setItem(key, JSON.stringify([record, ...existing.slice(0, 99)]));
  }

  getUsageRecords(userId?: string): UsageRecord[] {
    const uid = userId || this.getCurrentUser()?.id;
    if (!uid) return [];
    const raw = localStorage.getItem(`${STORAGE_KEYS.USAGE_PREFIX}${uid}`);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
}

export const storageService = new StorageService();
