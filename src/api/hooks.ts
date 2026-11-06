import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, newIdempotencyKey } from './client';
import type { AdminContent, AdminSeason, AdminUserRow, AuditEntry, BoxOfficeReading, BoxOfficeWindow, ContentKindPath, ContentNotificationStats, EconomySettings, Features, Holding, HomeResponse, LedgerEntry, Me, Paginated, PublicMovie, PublicSeries, PublicationStatus, PurchaseResult, RedeemResult, UserDeletionPreview, WalletSummary } from './types';
import { useAuthStore } from '../store/auth';

const authed = () => useAuthStore.getState().status === 'authenticated';
const walletUser = () => authed() && useAuthStore.getState().user?.role !== 'SUPERADMIN';

/* ---------- Sezioni attive ---------- */
/** Film e Serie TV sono visibili solo se abilitati dal Superadmin (il backend lo applica comunque). */
export const useFeatures = () => useQuery({ queryKey: ['features'], queryFn: () => api<Features>('/features'), staleTime: 60_000 });

export const useEconomy = () => useQuery({ queryKey: ['economy'], queryFn: () => api<EconomySettings>('/economy'), staleTime: 60_000 });

export function useUpdateEconomy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<EconomySettings>) => api<EconomySettings>('/admin/settings/economy', { method: 'PUT', body: patch }),
    onSuccess: (e) => qc.setQueryData(['economy'], e),
  });
}

/** Disponibilità dello username durante la registrazione (vuoto = nessun controllo). */
export const useUsernameAvailability = (username: string) =>
  useQuery({
    queryKey: ['username-available', username.toLowerCase()],
    queryFn: () => api<{ available: boolean; reason?: string }>(`/auth/username-available?username=${encodeURIComponent(username)}`),
    enabled: username.length >= 3,
    staleTime: 10_000,
  });

export function useUpdateFeatures() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Features>) => api<Features>('/admin/settings/features', { method: 'PUT', body: patch }),
    onSuccess: (f) => {
      qc.setQueryData(['features'], f);
      for (const k of ['home', 'movies', 'tv-series', 'movie', 'series', 'admin']) void qc.invalidateQueries({ queryKey: [k] });
    },
  });
}

/* ---------- Catalogo pubblico ---------- */
export const useHome = () => useQuery({ queryKey: ['home'], queryFn: () => api<HomeResponse>('/home') });

export interface CatalogFilters {
  page: number;
  q?: string;
  genre?: string;
  sort?: 'newest' | 'title' | 'price';
}

export const useMovies = (f: CatalogFilters) =>
  useQuery({ queryKey: ['movies', f], queryFn: () => api<Paginated<PublicMovie>>('/movies', { query: { ...f } }), placeholderData: keepPreviousData });
export const useMovie = (id: string) => useQuery({ queryKey: ['movie', id], queryFn: () => api<PublicMovie>(`/movies/${id}`), retry: false });
export const useSeriesList = (f: CatalogFilters) =>
  useQuery({ queryKey: ['tv-series', f], queryFn: () => api<Paginated<PublicSeries>>('/tv-series', { query: { ...f } }), placeholderData: keepPreviousData });
export const useSeries = (id: string) => useQuery({ queryKey: ['series', id], queryFn: () => api<PublicSeries>(`/tv-series/${id}`), retry: false });
export const useGenres = (kind: ContentKindPath) =>
  useQuery({ queryKey: ['genres', kind], queryFn: () => api<{ items: string[] }>(`/${kind}/genres`), staleTime: 300_000 });

/* ---------- Wallet ---------- */
export const useWallet = () => useQuery({ queryKey: ['wallet'], queryFn: () => api<WalletSummary>('/wallet'), enabled: walletUser() });
export const useHoldings = () => useQuery({ queryKey: ['holdings'], queryFn: () => api<{ items: Holding[] }>('/wallet/holdings'), enabled: walletUser() });
export const useTransactions = (page: number, category?: string) =>
  useQuery({
    queryKey: ['transactions', page, category],
    queryFn: () => api<Paginated<LedgerEntry>>('/transactions', { query: { page, pageSize: 20, category } }),
    placeholderData: keepPreviousData,
    enabled: walletUser(),
  });

/**
 * Acquisto: la chiave idempotente è generata una volta per "intenzione di acquisto"
 * (passata dal chiamante), così un doppio click o un retry non addebitano due volte.
 */
export function usePurchase(kind: ContentKindPath, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { quantity: number; seasonId?: string; idempotencyKey: string }) =>
      api<PurchaseResult>(`/${kind}/${id}/purchases`, {
        method: 'POST',
        body: { quantity: v.quantity, ...(v.seasonId ? { seasonId: v.seasonId } : {}) },
        idempotencyKey: v.idempotencyKey,
      }),
    onSuccess: () => {
      for (const k of ['wallet', 'holdings', 'transactions']) void qc.invalidateQueries({ queryKey: [k] });
    },
  });
}

/** Riscatto di un film: accredita l'incasso attuale e chiude la partecipazione. */
export function useRedeem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (holdingId: string) => api<RedeemResult>(`/wallet/holdings/${holdingId}/redeem`, { method: 'POST' }),
    onSuccess: () => {
      for (const k of ['wallet', 'holdings', 'transactions']) void qc.invalidateQueries({ queryKey: [k] });
    },
  });
}

export const useMovieBoxOffice = (id: string) =>
  useQuery({ queryKey: ['movie', id, 'box-office'], queryFn: () => api<{ items: BoxOfficeReading[] }>(`/movies/${id}/box-office`), retry: false });

export const useAdminBoxOffice = (id: string) =>
  useQuery({ queryKey: ['admin', 'movies', id, 'box-office'], queryFn: () => api<{ items: BoxOfficeReading[]; window: BoxOfficeWindow }>(`/admin/movies/${id}/box-office`) });

/* ---------- Profilo ---------- */
export function useUpdateProfile() {
  return useMutation({
    mutationFn: (body: Partial<NonNullable<Me['profile']>>) => api<Me>('/profile', { method: 'PATCH', body }),
    onSuccess: (me) => useAuthStore.getState().setUser(me),
  });
}

export function useAvatar() {
  return useMutation({
    mutationFn: (file: File | null) =>
      file ? api<Me>('/profile/avatar', { method: 'PUT', rawBody: file, contentType: file.type }) : api<Me>('/profile/avatar', { method: 'DELETE' }),
    onSuccess: (me) => useAuthStore.getState().setUser(me),
  });
}

export const useSessions = () =>
  useQuery({ queryKey: ['sessions'], queryFn: () => api<{ items: Array<{ id: string; createdAt: string; expiresAt: string; ip: string | null; userAgent: string | null }> }>('/auth/sessions') });

/* ---------- Admin ---------- */
export const useAdminDashboard = () =>
  useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () =>
      api<{
        users: { total: number; last7Days: number; admins: number };
        economy: { totalBalance: number; wallets: number };
        last24h: { transactions: number; purchases: number };
        content: Record<'movies' | 'tvSeries', Record<PublicationStatus, number>>;
      }>('/admin/dashboard'),
  });

/**
 * Con una pubblicazione programmata in vista, ricarica i dati subito dopo l'orario previsto,
 * così la pagina mostra "Pubblicato" senza doverla aggiornare a mano.
 */
function refetchAroundSchedule(items: Array<Pick<AdminContent, 'scheduledPublishAt'>>): number | false {
  const next = items.map((i) => (i.scheduledPublishAt ? new Date(i.scheduledPublishAt).getTime() : NaN)).filter((n) => !Number.isNaN(n));
  if (!next.length) return false;
  const ms = Math.min(...next) - Date.now();
  if (ms > 60_000) return 30_000;
  return Math.max(ms + 1_500, 2_000);
}

export const useAdminContentList = (kind: ContentKindPath, status: PublicationStatus | undefined, page: number, q?: string) =>
  useQuery({
    queryKey: ['admin', kind, 'list', status, page, q],
    queryFn: () => api<Paginated<AdminContent>>(`/admin/${kind}`, { query: { status, page, pageSize: 20, q } }),
    placeholderData: keepPreviousData,
    refetchInterval: (query) => refetchAroundSchedule(query.state.data?.items ?? []),
  });

export const useAdminContent = (kind: ContentKindPath, id: string | undefined) =>
  useQuery({
    queryKey: ['admin', kind, id],
    queryFn: () => api<AdminContent>(`/admin/${kind}/${id}`),
    enabled: !!id,
    refetchInterval: (query) => refetchAroundSchedule(query.state.data ? [query.state.data] : []),
  });

export const useAdminNotifications = (kind: ContentKindPath, id: string) =>
  useQuery({
    queryKey: ['admin', kind, id, 'notifications'],
    queryFn: () => api<ContentNotificationStats>(`/admin/${kind}/${id}/notifications`),
    // mentre le email partono, l'avanzamento si aggiorna da solo
    refetchInterval: (q) => ((q.state.data?.pending ?? 0) > 0 ? 10_000 : false),
  });

export const useUserDeletionPreview = (id: string) =>
  useQuery({ queryKey: ['admin', 'users', id, 'deletion-preview'], queryFn: () => api<UserDeletionPreview>(`/admin/users/${id}/deletion-preview`), staleTime: 0 });

export const useAdminSeasons = (seriesId: string | undefined) =>
  useQuery({ queryKey: ['admin', 'seasons', seriesId], queryFn: () => api<{ items: AdminSeason[] }>(`/admin/tv-series/${seriesId}/seasons`), enabled: !!seriesId });

export const useStatusCounts = (kind: ContentKindPath) =>
  useQuery({ queryKey: ['admin', kind, 'counts'], queryFn: () => api<Record<PublicationStatus, number>>(`/admin/${kind}/status-counts`) });

/** Mutazione amministrativa generica che invalida tutto ciò che riguarda i contenuti. */
export function useAdminMutation<TVars, TResult = unknown>(fn: (v: TVars) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin'] });
      for (const k of ['home', 'movies', 'tv-series', 'movie', 'series']) void qc.invalidateQueries({ queryKey: [k] });
    },
  });
}

export const useAdminUsers = (page: number, q?: string, role?: string) =>
  useQuery({
    queryKey: ['admin', 'users', page, q, role],
    queryFn: () => api<Paginated<AdminUserRow>>('/admin/users', { query: { page, pageSize: 20, q, role } }),
    placeholderData: keepPreviousData,
  });

export const useAdminPermissions = () =>
  useQuery({ queryKey: ['admin', 'permissions'], queryFn: () => api<{ items: Array<{ key: string; label: string }> }>('/admin/permissions'), staleTime: Infinity });

export const useAuditLogs = (page: number, filters: { entityType?: string; action?: string }) =>
  useQuery({
    queryKey: ['admin', 'audit', page, filters],
    queryFn: () => api<Paginated<AuditEntry>>('/admin/audit-logs', { query: { page, pageSize: 30, ...filters } }),
    placeholderData: keepPreviousData,
  });

export const useReconciliation = () =>
  useQuery({
    queryKey: ['admin', 'reconciliation'],
    queryFn: () => api<{ checkedAt: string; mismatches: number; items: unknown[] }>('/admin/wallet/reconciliation'),
    enabled: false,
  });

export { newIdempotencyKey };
