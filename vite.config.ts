import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Nome, descrizione e lingua dell'app vengono dal file dei testi (src/i18n/it.json).
const texts = JSON.parse(readFileSync(new URL('./src/i18n/it.json', import.meta.url), 'utf8'));
const appMeta = texts.app.meta as { name: string; shortName: string; description: string; pageDescription: string };

/** Sostituisce i segnaposto %APP_…% in index.html con i testi del file. */
const htmlTexts = (): Plugin => ({
  name: 'bustercinema-html-texts',
  transformIndexHtml: (html) =>
    html
      .replaceAll('%APP_LANG%', texts.meta.lang)
      .replaceAll('%APP_NAME%', appMeta.name)
      .replaceAll('%APP_PAGE_DESCRIPTION%', appMeta.pageDescription),
});

const API_TARGET = process.env.VITE_API_PROXY ?? 'http://localhost:4000';

export default defineConfig({
  plugins: [
    react(),
    htmlTexts(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: appMeta.name,
        short_name: appMeta.shortName,
        description: appMeta.description,
        lang: texts.meta.lang,
        start_url: '/app',
        scope: '/',
        display: 'standalone',
        background_color: '#F2F2F2',
        theme_color: '#1A7CB6',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Solo lo "shell" statico viene messo in cache. Le API (dati economici, saldi,
        // profili) non vengono MAI salvate offline: sempre e solo dalla rete.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//, /^\/health/],
        runtimeCaching: [{ urlPattern: ({ url }) => url.pathname.startsWith('/api/'), handler: 'NetworkOnly' }],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: false },
      '/uploads': { target: API_TARGET, changeOrigin: false },
    },
  },
  // Il chunk principale include React, Router, TanStack Query, Zod e styled-components.
  build: { sourcemap: true, chunkSizeWarningLimit: 650 },
});
