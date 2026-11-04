import { useAuthStore } from '../store/auth';
import type { Me, SessionResponse } from './types';

const BASE = '/api/v1';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Array<{ path: string; message: string }>;
  constructor(status: number, code: string, message: string, details?: Array<{ path: string; message: string }>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// L'access token vive solo in memoria (mai in localStorage): il refresh token è un cookie httpOnly.
let accessToken: string | null = null;
export const setAccessToken = (t: string | null) => {
  accessToken = t;
};

let refreshing: Promise<boolean> | null = null;

/** Rinnovo della sessione "single-flight": più richieste in 401 attendono lo stesso refresh. */
export function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-Requested-With': 'BusterCinema' },
      });
      if (!res.ok) throw new Error('refresh');
      const data = (await res.json()) as SessionResponse;
      applySession(data);
      return true;
    } catch {
      clearSession();
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export function applySession(data: SessionResponse) {
  setAccessToken(data.accessToken);
  useAuthStore.getState().setUser(data.user);
}

export function clearSession() {
  setAccessToken(null);
  useAuthStore.getState().setUser(null);
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  rawBody?: Blob;
  contentType?: string;
  idempotencyKey?: string;
  query?: Record<string, string | number | boolean | undefined | null>;
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  const qs = params.toString();
  return `${BASE}${path}${qs ? `?${qs}` : ''}`;
}

async function doFetch(path: string, opts: RequestOptions) {
  const headers: Record<string, string> = { 'X-Requested-With': 'BusterCinema' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;
  let body: BodyInit | undefined;
  if (opts.rawBody) {
    body = opts.rawBody;
    headers['Content-Type'] = opts.contentType ?? opts.rawBody.type;
  } else if (opts.body !== undefined) {
    body = JSON.stringify(opts.body);
    headers['Content-Type'] = 'application/json';
  }
  return fetch(buildUrl(path, opts.query), { method: opts.method ?? 'GET', headers, body, credentials: 'include' });
}

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  let res = await doFetch(path, opts);
  if (res.status === 401 && accessToken !== null && !path.startsWith('/auth/')) {
    if (await refreshSession()) res = await doFetch(path, opts);
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = data?.error ?? {};
    throw new ApiError(res.status, err.code ?? 'ERROR', err.message ?? 'Si è verificato un errore', err.details);
  }
  return data as T;
}

export async function login(email: string, password: string) {
  applySession(await api<SessionResponse>('/auth/login', { method: 'POST', body: { email, password } }));
}

export async function register(body: { email: string; username: string; password: string; acceptTerms: true }) {
  applySession(await api<SessionResponse>('/auth/register', { method: 'POST', body }));
}

export async function logout() {
  await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
  clearSession();
}

export function newIdempotencyKey() {
  return `web-${crypto.randomUUID()}`;
}

export type { Me };
