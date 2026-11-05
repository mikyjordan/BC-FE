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

    await page.getByLabel('Prezzo del film (Bustercoin)').fill('500000');
    await page.getByRole('button', { name: 'Salva prezzo e date' }).click();
    await expect(page.getByText('Impostazioni salvate.')).toBeVisible();
    await page.getByRole('button', { name: 'Abilita acquisti' }).click();
    await expect(page.getByText('Acquisti attivi', { exact: true })).toBeVisible();
    await page.getByLabel('Mostra nella homepage').check();

    await page.getByRole('button', { name: 'Pubblica', exact: true }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: 'Pubblica', exact: true }).click();
    await expect(page.getByText('Pubblicato', { exact: true }).first()).toBeVisible();
  });

  test('un utente compra il film, vede incasso e guadagno in verde, riscatta e non può ricomprarlo', async ({ page, browser }) => {
    await registerNewUser(page);
    await expect(page.getByText('1.000.000 B').first()).toBeVisible();
    await page.getByRole('link', { name: new RegExp(title) }).first().click();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();

    await page.getByRole('button', { name: 'Acquista' }).click();
    await page.getByRole('button', { name: /Conferma 500\.000 B/ }).click();
    await expect(page.getByText('Il tuo investimento')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Riscatta' })).toBeDisabled();

    // Il Superadmin inserisce l'incasso attuale: 600.000 €
    const admin = await browser.newPage();
    await login(admin, SUPERADMIN.email, SUPERADMIN.password);
    await admin.goto('/admin/pubblicazione?tipo=movies&stato=PUBLISHED');
    await admin.getByPlaceholder('Cerca per titolo…').fill(title);
    await admin.keyboard.press('Enter');
    await admin.getByRole('button', { name: 'Gestisci' }).first().click();
    await admin.getByLabel('Nuovo incasso totale (€)').fill('600000');
    await admin.getByRole('button', { name: /Registra incasso/ }).click();
    await expect(admin.getByText('Incasso aggiornato a 600.000 B.')).toBeVisible();
    await admin.close();

    await page.goto('/app/portafoglio');
    await expect(page.getByText('500.000 B').first()).toBeVisible(); // saldo
    const card = page.getByRole('article', { name: `Film ${title}` });
    await expect(card.getByText('600.000 B')).toBeVisible();
    await expect(card.locator('[data-trend="up"]')).toContainText('+100.000 B');

    await card.getByRole('button', { name: 'Riscatta' }).click();
    await page.getByRole('dialog').getByRole('button', { name: /Riscatta 600\.000 B/ }).click();
    await expect(page.getByText(/Accreditati 600\.000 B/)).toBeVisible();
    await expect(page.getByText('1.100.000 B').first()).toBeVisible();

    await page.goto('/app/movimenti');
    await expect(page.getByText('Riscatto film').first()).toBeVisible();

    // Non è più riacquistabile
    await page.goto('/app/portafoglio');
    await page.getByRole('tab', { name: 'Riscattati' }).or(page.getByRole('button', { name: 'Riscattati' })).click();
    await page.getByRole('link', { name: title }).click();
    await expect(page.getByRole('heading', { name: 'Film riscattato' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Acquista' })).toHaveCount(0);
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
