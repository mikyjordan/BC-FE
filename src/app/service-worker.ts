/**
 * PWA: registra il service worker generato dalla build (build/sw.js). In sviluppo non si
 * registra, così il server di sviluppo non viene mai servito da una cache.
 */
export function registerServiceWorker() {
  if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err: unknown) => console.warn('[pwa] service worker non registrato', err));
  });
}
