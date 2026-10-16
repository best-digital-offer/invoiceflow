import type { Invoice, ReconciliationRun, UsageRecord, User } from '../types';
import { supabaseAuth } from './supabaseAuth';

const BUCKET = 'invoice-documents';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isSupabaseUserId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function settings() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !key) throw new Error('Supabase is not configured.');
  return { url: url.replace(/\/+$/, ''), key };
}

async function request<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const { url, key } = settings();
  const token = await supabaseAuth.getAccessToken();
  if (!token) throw new Error('Your session has expired. Please sign in again.');

  const headers = new Headers(init.headers);
  headers.set('apikey', key);
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(init.body instanceof Blob)) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${url}${path}`, { ...init, headers });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.message ?? body?.error ?? body?.hint;
    throw new Error(typeof message === 'string' ? message : `Supabase request failed (HTTP ${response.status}).`);
  }
  return body as T;
}

function withoutEmbeddedPdf(invoice: Invoice): Invoice {
  const copy = { ...invoice };
  delete copy.fileDataUrl;
  return copy;
}

export const supabaseData = {
  async upsertProfile(user: User): Promise<void> {
    if (!isSupabaseUserId(user.id)) return;
    await request('/rest/v1/profiles?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        id: user.id,
        full_name: user.name,
        company_name: user.companyName,
        role: user.role,
        updated_at: new Date().toISOString(),
      }),
    });
  },

  async fetchInvoices(userId: string): Promise<Invoice[]> {
    if (!isSupabaseUserId(userId)) return [];
    const rows = await request<Array<{ invoice_data: Invoice }>>(
      `/rest/v1/invoices?select=invoice_data&user_id=eq.${encodeURIComponent(userId)}&order=updated_at.desc`,
    );
    return Promise.all((rows ?? []).map(async row => {
      const invoice = { ...row.invoice_data, ownerId: userId };
      if (invoice.documentPath) {
        try {
          invoice.fileDataUrl = await this.getSignedPdfUrl(invoice.documentPath);
        } catch {
          // Keep invoice metadata accessible if a temporary preview URL cannot be created.
        }
      }
      return invoice;
    }));
  },

  async upsertInvoice(invoice: Invoice): Promise<void> {
    if (!isSupabaseUserId(invoice.ownerId)) return;
    const data = withoutEmbeddedPdf(invoice);
    await request('/rest/v1/invoices?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        id: invoice.id,
        user_id: invoice.ownerId,
        invoice_data: data,
        created_at: invoice.createdAt,
        updated_at: invoice.updatedAt,
      }),
    });
  },

  async deleteInvoice(userId: string, invoiceId: string): Promise<void> {
    if (!isSupabaseUserId(userId)) return;
    await request(`/rest/v1/invoices?id=eq.${encodeURIComponent(invoiceId)}&user_id=eq.${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: { Prefer: 'return=minimal' },
    });
    const { url } = settings();
    const token = await supabaseAuth.getAccessToken();
    if (token) {
      await fetch(`${url}/storage/v1/object/${BUCKET}/${encodeURIComponent(userId)}/${encodeURIComponent(invoiceId)}.pdf`, {
        method: 'DELETE',
        headers: { apikey: settings().key, Authorization: `Bearer ${token}` },
      }).catch(() => undefined);
    }
  },

  async uploadInvoicePdf(userId: string, invoiceId: string, file: File): Promise<string | undefined> {
    if (!isSupabaseUserId(userId)) return undefined;
    const { url, key } = settings();
    const token = await supabaseAuth.getAccessToken();
    if (!token) throw new Error('Your session has expired. Please sign in again.');
    const path = `${userId}/${invoiceId}.pdf`;
    const response = await fetch(`${url}/storage/v1/object/${BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/pdf',
        'x-upsert': 'true',
      },
      body: file,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message || body.error || `PDF storage failed (HTTP ${response.status}).`);
    }
    return path;
  },

  async getSignedPdfUrl(path: string): Promise<string> {
    const { url } = settings();
    const signed = await request<{ signedURL: string }>(
      `/storage/v1/object/sign/${BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`,
      { method: 'POST', body: JSON.stringify({ expiresIn: 86400 }) },
    );
    return signed.signedURL.startsWith('http')
      ? signed.signedURL
      : `${url}/storage/v1${signed.signedURL.startsWith('/') ? '' : '/'}${signed.signedURL}`;
  },

  async fetchReconciliations(userId: string): Promise<ReconciliationRun[]> {
    if (!isSupabaseUserId(userId)) return [];
    const rows = await request<Array<{ run_data: ReconciliationRun }>>(
      `/rest/v1/reconciliation_runs?select=run_data&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc`,
    );
    return (rows ?? []).map(row => ({ ...row.run_data, ownerId: userId }));
  },

  async upsertReconciliation(run: ReconciliationRun): Promise<void> {
    if (!isSupabaseUserId(run.ownerId)) return;
    await request('/rest/v1/reconciliation_runs?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ id: run.id, user_id: run.ownerId, run_data: run, created_at: run.createdAt }),
    });
  },

  async fetchUsageRecords(userId: string): Promise<UsageRecord[]> {
    if (!isSupabaseUserId(userId)) return [];
    const rows = await request<Array<{
      id: string; operation: UsageRecord['operation']; status: UsageRecord['status'];
      item_count: number; details: string; occurred_at: string;
    }>>(
      `/rest/v1/usage_records?select=id,operation,status,item_count,details,occurred_at&user_id=eq.${encodeURIComponent(userId)}&order=occurred_at.desc&limit=100`,
    );
    return (rows ?? []).map(row => ({
      id: row.id, userId, operation: row.operation, status: row.status,
      itemCount: row.item_count, details: row.details, timestamp: row.occurred_at,
    }));
  },

  async upsertUsageRecord(record: UsageRecord): Promise<void> {
    if (!isSupabaseUserId(record.userId)) return;
    await request('/rest/v1/usage_records?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        id: record.id, user_id: record.userId, operation: record.operation,
        status: record.status, item_count: record.itemCount, details: record.details,
        occurred_at: record.timestamp,
      }),
    });
  },
};
