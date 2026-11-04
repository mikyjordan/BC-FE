import { expect, type Page } from '@playwright/test';

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
  await expect(page).toHaveURL(/\/app$/);
  return user;
}

export async function logout(page: Page) {
  await page.context().clearCookies();
}
