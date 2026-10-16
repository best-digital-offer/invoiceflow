import type { User } from '../types';

const SESSION_KEY = 'invoiceflow_supabase_session';

type SupabaseUser = {
  id: string;
  email?: string;
  created_at?: string;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
  user_metadata?: Record<string, unknown>;
};

type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  expires_at?: number;
  token_type?: string;
  user?: SupabaseUser;
};

type AuthResult = {
  user: User;
  session: SupabaseSession;
};

function config() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !key) {
    throw new Error('Supabase authentication is not configured for this deployment. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.');
  }
  return { url: url.replace(/\/+$/, ''), key };
}

function readSession(): SupabaseSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) as SupabaseSession : null;
  } catch {
    return null;
  }
}

function saveSession(session: SupabaseSession) {
  const normalized = {
    ...session,
    expires_at: session.expires_at ?? Math.floor(Date.now() / 1000) + (session.expires_in ?? 3600),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
  return normalized;
}

function mapUser(authUser: SupabaseUser): User {
  const metadata = authUser.user_metadata ?? {};
  const plan = metadata.plan === 'monthly' || metadata.plan === 'annual' ? metadata.plan : 'free_trial';
  const email = authUser.email ?? '';
  return {
    id: authUser.id,
    name: typeof metadata.full_name === 'string' && metadata.full_name.trim()
      ? metadata.full_name
      : (email.split('@')[0] || 'User'),
    email,
    companyName: typeof metadata.company_name === 'string' && metadata.company_name.trim()
      ? metadata.company_name
      : 'My Organization',
    role: typeof metadata.role === 'string' && metadata.role.trim()
      ? metadata.role
      : 'Finance Specialist',
    plan,
    isEmailVerified: Boolean(authUser.email_confirmed_at || authUser.confirmed_at),
    createdAt: authUser.created_at ?? new Date().toISOString(),
  };
}

async function authRequest<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const { url, key } = config();
  const headers = new Headers(options.headers);
  headers.set('apikey', key);
  headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const response = await fetch(`${url}/auth/v1${path}`, {
    ...options,
    headers,
  });
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const message = payload.msg ?? payload.message ?? payload.error_description ?? payload.error;
    throw new Error(typeof message === 'string' ? message : `Authentication request failed (HTTP ${response.status}).`);
  }
  return payload as T;
}

async function refreshSession(session: SupabaseSession): Promise<SupabaseSession> {
  const refreshed = await authRequest<SupabaseSession>('/token?grant_type=refresh_token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  return saveSession(refreshed);
}

export const supabaseAuth = {
  isConfigured(): boolean {
    return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  },

  async signUp(input: {
    name: string;
    email: string;
    password: string;
    companyName: string;
    plan: User['plan'];
  }): Promise<{ user: User | null; needsEmailConfirmation: boolean }> {
    const result = await authRequest<{ user?: SupabaseUser; session?: SupabaseSession | null }>('/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: input.email.trim(),
        password: input.password,
        data: {
          full_name: input.name.trim(),
          company_name: input.companyName.trim(),
          plan: input.plan,
        },
      }),
    });

    if (result.session?.access_token && result.user) {
      saveSession({ ...result.session, user: result.user });
      return { user: mapUser(result.user), needsEmailConfirmation: false };
    }

    return { user: null, needsEmailConfirmation: true };
  },

  async signIn(email: string, password: string): Promise<User> {
    const result = await authRequest<SupabaseSession>('/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password }),
    });
    if (!result.access_token || !result.user) {
      throw new Error('Sign-in did not return a valid session. Check your credentials and email verification.');
    }
    saveSession(result);
    return mapUser(result.user);
  },

  async requestPasswordReset(email: string): Promise<void> {
    config();
    await authRequest('/recover?redirect_to=' + encodeURIComponent(window.location.origin), {
      method: 'POST',
      body: JSON.stringify({ email: email.trim() }),
    });
  },

  async updatePassword(password: string): Promise<User> {
    const session = readSession();
    if (!session?.access_token) throw new Error('The password reset session is missing or expired. Request a new reset email.');
    const result = await authRequest<SupabaseUser>('/user', {
      method: 'PUT',
      body: JSON.stringify({ password }),
    }, session.access_token);
    const updatedSession = saveSession({ ...session, user: result });
    void updatedSession;
    return mapUser(result);
  },

  async signOut(): Promise<void> {
    const session = readSession();
    try {
      if (session?.access_token && this.isConfigured()) {
        await authRequest('/logout', { method: 'POST' }, session.access_token);
      }
    } catch {
      // Local sign-out must still succeed when the network is unavailable.
    } finally {
      localStorage.removeItem(SESSION_KEY);
    }
  },

  async restoreSession(): Promise<User | null> {
    if (!this.isConfigured()) return null;
    let session = readSession();
    if (!session?.access_token || !session.refresh_token) return null;

    try {
      const expiry = session.expires_at ?? 0;
      if (expiry * 1000 <= Date.now() + 60_000) {
        session = await refreshSession(session);
      }
      const user = await authRequest<SupabaseUser>('/user', { method: 'GET' }, session.access_token);
      saveSession({ ...session, user });
      return mapUser(user);
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  },

  consumePasswordRecoveryRedirect(): boolean {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return false;
    const params = new URLSearchParams(hash.slice(1));
    if (params.get('type') !== 'recovery') return false;
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (!accessToken || !refreshToken) return false;
    const expiresIn = Number(params.get('expires_in') || 3600);
    saveSession({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      token_type: params.get('token_type') || 'bearer',
    });
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    return true;
  },
};
