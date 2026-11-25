import { defineConfig, devices } from "@playwright/test";

/**
 * Test end-to-end sull'applicazione completa (frontend + API + PostgreSQL).
 * Prerequisiti: sito servito su :4000 (npm run build && serve -s build -p 4000), backend avviato con migrazioni applicate e un Superadmin creato
 * con le credenziali E2E_SUPERADMIN_EMAIL / E2E_SUPERADMIN_PASSWORD.
 * PW_CHROME_CHANNEL=chrome usa il Chrome di sistema invece del browser scaricato da Playwright.
 */
const channel = process.env.PW_CHROME_CHANNEL;

export default defineConfig({
  testDir: "e2e",
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:4000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "it-IT",
    // Per verificare che il sito usi l'ora italiana anche su dispositivi in altri fusi: E2E_TIMEZONE=America/New_York
    ...(process.env.E2E_TIMEZONE ? { timezoneId: process.env.E2E_TIMEZONE } : {}),
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], ...(channel ? { channel } : {}) }, testIgnore: /responsive\.spec\.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"], ...(channel ? { channel } : {}) }, testMatch: /responsive\.spec\.ts/ },
  ],
});
