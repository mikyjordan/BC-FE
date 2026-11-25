import { useAuthStore } from "../store/auth";
import type { Me, SessionResponse } from "./types";
import { t } from "../i18n";
import { API_ORIGIN } from "./origin";

const BASE = `${API_ORIGIN}/api/v1`;

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
        method: "POST",
        credentials: "include",
        headers: { "X-Requested-With": "BusterCinema" },
      });
      if (!res.ok) throw new Error("refresh");
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
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  rawBody?: Blob;
  contentType?: string;
  idempotencyKey?: string;
  query?: Record<string, string | number | boolean | undefined | null>;
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  const qs = params.toString();
  return `${BASE}${path}${qs ? `?${qs}` : ""}`;
}

async function doFetch(path: string, opts: RequestOptions) {
  const headers: Record<string, string> = { "X-Requested-With": "BusterCinema" };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;
  let body: BodyInit | undefined;
  if (opts.rawBody) {
    body = opts.rawBody;
    headers["Content-Type"] = opts.contentType ?? opts.rawBody.type;
  } else if (opts.body !== undefined) {
    body = JSON.stringify(opts.body);
    headers["Content-Type"] = "application/json";
  }
  return fetch(buildUrl(path, opts.query), { method: opts.method ?? "GET", headers, body, credentials: "include" });
}

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  let res = await doFetch(path, opts);
  if (res.status === 401 && accessToken !== null && !path.startsWith("/auth/")) {
    if (await refreshSession()) res = await doFetch(path, opts);
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = data?.error ?? {};
    throw new ApiError(res.status, err.code ?? "ERROR", err.message ?? t("api.client.siEVerificatoUnErrore"), err.details);
  }
  return data as T;
}

export async function login(email: string, password: string) {
  applySession(await api<SessionResponse>("/auth/login", { method: "POST", body: { email, password } }));
}

/** Registrazione: l'account va poi confermato dal link ricevuto via email (nessuna sessione qui). */
export async function register(body: { email: string; username: string; password: string; acceptTerms: true }) {
  return api<{ email: string; verificationRequired: true }>("/auth/register", { method: "POST", body });
}

/** Conferma dell'email: attiva l'account e apre la sessione. Restituisce il bonus accreditato. */
export async function verifyEmail(token: string): Promise<number> {
  const res = await api<SessionResponse & { welcomeBonus: number }>("/auth/verify-email", { method: "POST", body: { token } });
  applySession(res);
  return res.welcomeBonus;
}

export async function resendVerification(email: string) {
  await api("/auth/resend-verification", { method: "POST", body: { email } });
}

export async function logout() {
  await api("/auth/logout", { method: "POST" }).catch(() => undefined);
  clearSession();
}

/**
 * Identificativo casuale (UUID v4). crypto.randomUUID esiste solo nelle pagine sicure
 * (https o localhost): aprendo il sito da un altro dispositivo in http, per esempio
 * http://192.168.x.x:4000 dal cellulare, non c'è. crypto.getRandomValues invece è sempre
 * disponibile ed è altrettanto sicuro.
 */
export function randomId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; // versione 4
  b[8] = (b[8] & 0x3f) | 0x80; // variante RFC 4122
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function newIdempotencyKey() {
  return `web-${randomId()}`;
}

export type { Me };
