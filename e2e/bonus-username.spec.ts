import { expect, test } from '@playwright/test';
import { login, registerNewUser, SUPERADMIN } from './helpers';

test('lo username già usato viene segnalato in registrazione e nel profilo non si può modificare', async ({ page, browser }) => {
  const other = await browser.newPage();
  const taken = await registerNewUser(other);
  await other.close();

  await page.goto('/registrazione');
  await page.getByLabel('Nome utente').fill(taken.username.toUpperCase());
  await expect(page.getByText('Nome utente già in uso')).toBeVisible();
  await page.getByLabel('Nome utente').fill(`${taken.username}_x`);
  await expect(page.getByText('Nome utente disponibile')).toBeVisible();

  const user = await registerNewUser(page);
  await page.goto('/app/profilo');
  const field = page.getByLabel('Nome utente');
  await expect(field).toHaveValue(user.username);
  await expect(field).toBeDisabled();
  await expect(page.getByText('Il nome utente si sceglie alla registrazione e non si può modificare.')).toBeVisible();
});

test('i bonus vengono dalla configurazione: Impostazioni del Superadmin e pagine informative', async ({ page }) => {
  await page.goto('/come-funziona');
  await expect(page.getByText('ricevi 1.000.000 Bustercoin di benvenuto')).toBeVisible();
  await expect(page.getByText('Ogni settimana, il lunedì, ricevi altri 100.000 Bustercoin')).toBeVisible();

  await login(page, SUPERADMIN.email, SUPERADMIN.password);
  await page.goto('/admin/impostazioni');
  const card = page.getByTestId('economy-settings');
  await expect(card.getByLabel('Bonus di benvenuto (Bustercoin)')).toHaveValue('1000000');
  await expect(card.getByLabel('Bonus settimanale (Bustercoin)')).toHaveValue('100000');
  await expect(card.getByRole('button', { name: 'Salva bonus' })).toBeDisabled();
  await card.getByLabel('Bonus settimanale (Bustercoin)').fill('-5');
  await expect(card.getByText('Inserisci un numero intero maggiore o uguale a zero.')).toBeVisible();
  await expect(card.getByRole('button', { name: 'Salva bonus' })).toBeDisabled();
});
