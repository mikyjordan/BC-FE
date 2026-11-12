import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, type Page } from '@playwright/test';

/**
 * Senza SMTP il backend di sviluppo salva ogni email come file .html in backend/tmp/mails
 * (MAIL_PREVIEW_DIR): i test leggono da lì il link di conferma, come farebbe l'utente.
 */
export const MAIL_DIR = process.env.E2E_MAIL_DIR ?? fileURLToPath(new URL('../../backend/tmp/mails', import.meta.url));

/** Email ricevute da un indirizzo (contenuto HTML), dalla più recente. */
export function mailsTo(email: string): string[] {
  let files: string[] = [];
  try { files = readdirSync(MAIL_DIR); } catch { return []; }
  return files
    .filter((f) => f.endsWith(`_${email}.html`))
    .sort()
    .reverse()
    .map((f) => readFileSync(path.join(MAIL_DIR, f), 'utf8'));
}

/** Percorso del link di conferma contenuto nell'ultima email ricevuta. */
export async function verificationPath(email: string): Promise<string> {
  let link: string | undefined;
  await expect.poll(() => {
    link = mailsTo(email).map((h) => /href="([^"]*\/verifica-email\?token=[^"]+)"/.exec(h)?.[1]).find(Boolean);
    return !!link;
  }, { timeout: 10_000 }).toBe(true);
  const url = new URL(link!.replace(/&amp;/g, '&'));
  return url.pathname + url.search;
}

/**
 * Fa uscire un film nelle sale oggi con il comando di sviluppo del backend
 * (npm run film:simula-uscita), come se fosse arrivata la data di uscita.
 */
export function simulateRelease(title: string) {
  execFileSync('npm', ['run', '--silent', 'film:simula-uscita', '--', title], {
    cwd: fileURLToPath(new URL('../../backend', import.meta.url)),
    stdio: 'pipe',
    shell: process.platform === 'win32',
  });
}

/** L'API è un server distinto dal sito (porta 4000). */
export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:4000';

export const SUPERADMIN = {
  email: process.env.E2E_SUPERADMIN_EMAIL ?? 'admin@bustercinema.local',
  password: process.env.E2E_SUPERADMIN_PASSWORD ?? 'SuperAdmin2026',
};

export const uid = () => Math.random().toString(36).slice(2, 9);

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Accedi' }).click();
  await expect(page).toHaveURL(/\/app/);
}

export async function registerNewUser(page: Page) {
  const id = uid();
  const user = { email: `e2e_${id}@test.local`, username: `e2e_${id}`, password: 'Password1234' };
  await page.goto('/registrazione');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Nome utente').fill(user.username);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByLabel('Conferma password').fill(user.password);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Registrati' }).click();
  await expect(page.getByTestId('registration-pending')).toBeVisible();
  // Apertura del link ricevuto via email: account attivato e accesso diretto
  await page.goto(await verificationPath(user.email));
  await expect(page).toHaveURL(/\/app$/);
  return user;
}

export async function logout(page: Page) {
  await page.context().clearCookies();
}
