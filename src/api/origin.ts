/**
 * Indirizzo dell'API (backend), deciso alla build.
 *
 * - REACT_APP_API_URL impostato (es. https://api.miosito.it): si usa quello.
 * - In sviluppo (npm start): stesso indirizzo della pagina, il server di sviluppo fa da proxy.
 * - Build servita con `serve` senza REACT_APP_API_URL: stesso host della pagina, porta 4000
 *   (REACT_APP_API_PORT per cambiarla). Funziona anche dal cellulare sulla rete di casa.
 */
function apiOrigin(): string {
  const configured = (process.env.REACT_APP_API_URL ?? '').trim().replace(/\/+$/, '');
  if (configured) return configured;
  if (process.env.NODE_ENV !== 'production' || typeof window === 'undefined') return '';
  const port = process.env.REACT_APP_API_PORT || '4000';
  return `${window.location.protocol}//${window.location.hostname}:${port}`;
}

export const API_ORIGIN = apiOrigin();

/** Le immagini caricate sul server (/uploads/...) stanno sul backend, non sul sito. */
export const assetUrl = (url: string | null | undefined): string | null => (url && url.startsWith('/uploads/') ? `${API_ORIGIN}${url}` : (url ?? null));
