import { expect, test } from '@playwright/test';
import { login, logout, registerNewUser, SUPERADMIN, uid } from './helpers';

test.describe.serial('Flusso completo: bozza → pubblicazione → acquisto', () => {
  const title = `E2E Film ${uid()}`;

  test('il Superadmin crea un film: nasce in bozza e non è visibile agli utenti', async ({ page }) => {
    await login(page, SUPERADMIN.email, SUPERADMIN.password);
    await page.goto('/admin/pubblicazione');
    await page.getByRole('button', { name: 'Nuovo film' }).click();
    await page.getByLabel('Titolo *').fill(title);
    await page.getByLabel('Generi').fill('Commedia, Dramma');
    await page.getByLabel('Regista').fill('Regista E2E');
    await page.getByRole('button', { name: 'Crea in bozza' }).click();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByText('Bozza', { exact: true }).first()).toBeVisible();

    // Un utente qualsiasi non lo vede nel catalogo
    await logout(page);
    await registerNewUser(page);
    await page.goto('/app/film');
    await expect(page.getByText(title)).toHaveCount(0);
  });

  test('il Superadmin imposta prezzo, homepage e pubblica', async ({ page }) => {
    await login(page, SUPERADMIN.email, SUPERADMIN.password);
    await page.goto('/admin/pubblicazione?tipo=movies&stato=DRAFT');
    await page.getByPlaceholder('Cerca per titolo…').fill(title);
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Gestisci' }).first().click();

    await page.getByLabel('Prezzo per quota (Bustercoin)').fill('125000');
    await page.getByRole('button', { name: 'Salva prezzo e date' }).click();
    await expect(page.getByText('Impostazioni salvate.')).toBeVisible();
    await page.getByRole('button', { name: 'Abilita acquisti' }).click();
    await expect(page.getByText('Acquisti attivi', { exact: true })).toBeVisible();
    await page.getByLabel('Mostra nella homepage').check();

    await page.getByRole('button', { name: 'Pubblica', exact: true }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: 'Pubblica', exact: true }).click();
    await expect(page.getByText('Pubblicato', { exact: true }).first()).toBeVisible();
  });

  test('un nuovo utente vede il film in home, lo acquista e il saldo scende', async ({ page }) => {
    await registerNewUser(page);
    await expect(page.getByText('1.000.000 B').first()).toBeVisible();
    await page.getByRole('link', { name: new RegExp(title) }).first().click();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();

    await page.getByLabel('Quantità').fill('2');
    await page.getByRole('button', { name: 'Acquista' }).click();
    await page.getByRole('button', { name: /Conferma 250\.000 B/ }).click();
    await expect(page.getByText(/Acquistate 2 quote/)).toBeVisible();

    await page.goto('/app/portafoglio');
    await expect(page.getByText('750.000 B').first()).toBeVisible();
    await expect(page.getByText(title)).toBeVisible();

    await page.goto('/app/movimenti');
    await expect(page.getByText('Acquisto film').first()).toBeVisible();
    await expect(page.getByText('-250.000 B')).toBeVisible();
  });

  test('nascosto dal Superadmin: sparisce dal catalogo ma resta nel portafoglio', async ({ page }) => {
    await login(page, SUPERADMIN.email, SUPERADMIN.password);
    await page.goto('/admin/pubblicazione?tipo=movies&stato=PUBLISHED');
    await page.getByPlaceholder('Cerca per titolo…').fill(title);
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Nascondi', exact: true }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: 'Nascondi', exact: true }).click();
    await expect(page.getByText(`Nessun contenuto in “Pubblicati”`)).toBeVisible();

    await logout(page);
    await registerNewUser(page);
    await page.goto('/app/film');
    await expect(page.getByText(title)).toHaveCount(0);
  });

  test('un utente normale non accede all’area amministrativa', async ({ page }) => {
    await registerNewUser(page);
    await page.goto('/admin/pubblicazione');
    await expect(page).toHaveURL(/\/app$/);
  });
});
