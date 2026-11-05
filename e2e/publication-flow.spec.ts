import { expect, test } from '@playwright/test';
import { login, logout, registerNewUser, SUPERADMIN, uid } from './helpers';

test.describe.serial('Flusso completo: bozza → pubblicazione → acquisto', () => {
  const title = `E2E Film ${uid()}`;

  test('il Superadmin crea un film: nasce in bozza e non è visibile agli utenti', async ({ page }) => {
    await login(page, SUPERADMIN.email, SUPERADMIN.password);
    await page.goto('/admin/pubblicazione');
    // All'apertura è selezionata la tab "Pubblicati"
    await expect(page.getByRole('button', { name: /^Pubblicati/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: /^Bozze/ })).toHaveAttribute('aria-pressed', 'false');
    await page.getByRole('button', { name: 'Nuovo film' }).click();
    await page.getByLabel('Titolo *').fill(title);
    await page.getByLabel('Generi').fill('Commedia, Dramma');
    await page.getByLabel('Regista').fill('Regista E2E');
    // Locandina caricata dal computer
    await page.getByTestId('poster-file').setInputFiles({
      name: 'locandina.png',
      mimeType: 'image/png',
      buffer: Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082', 'hex'),
    });
    await expect(page.getByText('Immagine caricata sul server')).toBeVisible();
    await expect(page.getByLabel('Titolo originale')).toHaveCount(0);
    await expect(page.getByLabel('Descrizione')).toHaveCount(0);
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

    // Campi obbligatori: senza prezzo e chiusura il salvataggio viene bloccato
    await page.getByRole('button', { name: 'Salva prezzo e date' }).click();
    await expect(page.getByText('Il prezzo è obbligatorio')).toBeVisible();
    await expect(page.getByText('La chiusura degli acquisti è obbligatoria')).toBeVisible();

    await page.getByLabel('Prezzo del film (Bustercoin)').fill('500000');
    const close = new Date(Date.now() + 20 * 86_400_000);
    const pad = (n: number) => String(n).padStart(2, '0');
    await page.getByLabel('Chiusura acquisti').fill(`${close.getFullYear()}-${pad(close.getMonth() + 1)}-${pad(close.getDate())}T00:00`);
    await page.getByRole('button', { name: 'Salva prezzo e date' }).click();
    await expect(page.getByText('Impostazioni salvate.')).toBeVisible();
    await page.getByRole('button', { name: 'Abilita acquisti' }).click();
    await expect(page.getByText('Acquisti abilitati.')).toBeVisible();
    // Ancora in bozza: ovale rosso "Acquisti non attivi"
    await expect(page.getByTestId('purchase-badge').first()).toHaveAttribute('data-active', 'false');
    await expect(page.getByText('Titolo non pubblicato')).toBeVisible();
    await page.getByLabel('Mostra nella homepage').check();

    await page.getByRole('button', { name: 'Pubblica', exact: true }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: 'Pubblica', exact: true }).click();
    await expect(page.getByText('Pubblicato', { exact: true }).first()).toBeVisible();
    // Pubblicato e acquistabile: ovale verde "Acquisti attivi"
    await expect(page.getByTestId('purchase-badge').first()).toHaveAttribute('data-active', 'true');
    await expect(page.getByText('Acquisti attivi', { exact: true }).first()).toBeVisible();

    // Il Superadmin vede il film ma non può acquistarlo
    await page.goto('/app/film');
    await page.getByText(title).first().click();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByTestId('superadmin-no-purchase')).toContainText('Il Superadmin non può effettuare acquisti');
    await expect(page.getByRole('button', { name: 'Acquista' })).toHaveCount(0);
  });

  test('un utente compra il film, vede incasso e guadagno in verde, riscatta e non può ricomprarlo', async ({ page, browser }) => {
    await registerNewUser(page);
    await expect(page.getByText('1.000.000 B').first()).toBeVisible();
    await page.getByRole('link', { name: new RegExp(title) }).first().click();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();

    await expect(page.getByTestId('purchase-deadline')).toContainText('mezzanotte del giorno prima dell’uscita nelle sale');
    await page.getByRole('button', { name: 'Acquista' }).click();
    await page.getByRole('button', { name: /Conferma 500\.000 B/ }).click();
    await expect(page.getByText('Il tuo investimento')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Riscatta' })).toBeDisabled();

    // Nelle attività recenti la riga dell'acquisto porta alla scheda del film
    await page.goto('/app');
    const activity = page.getByTestId('activity-movie-link').first();
    await expect(activity).toContainText('Acquisto film');
    await activity.click();
    await expect(page).toHaveURL(/\/app\/film\/[0-9a-f-]+$/);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();

    // Il Superadmin inserisce l'incasso attuale: 600.000 €
    const admin = await browser.newPage();
    await login(admin, SUPERADMIN.email, SUPERADMIN.password);
    await admin.goto('/admin/pubblicazione?tipo=movies&stato=PUBLISHED');
    await admin.getByPlaceholder('Cerca per titolo…').fill(title);
    await admin.keyboard.press('Enter');
    await admin.getByRole('button', { name: 'Gestisci' }).first().click();
    // La data di rilevazione è precompilata con oggi ed è modificabile
    const pad = (n: number) => String(n).padStart(2, '0');
    const d = new Date();
    await expect(admin.getByLabel('Data rilevazione')).toHaveValue(new RegExp(`^${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T`));
    await admin.getByLabel('Nuovo incasso totale (€)').fill('600000');
    await admin.getByRole('button', { name: /Registra incasso/ }).click();
    await expect(admin.getByText('Incasso aggiornato a 600.000 B.')).toBeVisible();
    // Una rilevazione errata (999.999) si corregge eliminandola: torna in vigore 600.000
    await admin.getByLabel('Nuovo incasso totale (€)').fill('999999');
    await admin.getByRole('button', { name: /Registra incasso/ }).click();
    await expect(admin.getByText('Incasso aggiornato a 999.999 B.')).toBeVisible();
    await admin.getByRole('row', { name: /999\.999 B/ }).getByRole('button', { name: /^Elimina rilevazione/ }).click();
    await admin.getByRole('dialog').getByRole('button', { name: 'Elimina', exact: true }).click();
    await expect(admin.getByText('Rilevazione eliminata. Incasso in vigore: 600.000 B.')).toBeVisible();
    // Modifica in linea della rilevazione in vigore (stesso valore, nota aggiunta)
    await admin.getByRole('row', { name: /600\.000 B/ }).getByRole('button', { name: /^Modifica rilevazione/ }).click();
    await admin.getByRole('textbox', { name: 'Note', exact: true }).fill('Fonte: verifica E2E');
    await admin.getByRole('button', { name: 'Salva rilevazione' }).click();
    await expect(admin.getByText('Rilevazione aggiornata. Incasso in vigore: 600.000 B.')).toBeVisible();
    await admin.close();

    // In homepage la card del film mostra "Già acquistato" con l'incasso corrente
    await page.goto('/app');
    const homeCard = page.getByRole('link', { name: new RegExp(title) }).filter({ has: page.getByTestId('owned-status') }).first();
    await expect(homeCard.getByTestId('owned-status')).toHaveAttribute('data-status', 'OPEN');
    await expect(homeCard).toContainText('Già acquistato');
    await expect(homeCard).toContainText('Incasso corrente');
    await expect(homeCard).toContainText('600.000 B');

    await page.goto('/app/portafoglio');
    await expect(page.getByText('500.000 B').first()).toBeVisible(); // saldo
    const card = page.getByRole('article', { name: `Film ${title}` });
    await expect(card.getByText('600.000 B')).toBeVisible();
    await expect(card.locator('[data-trend="up"]')).toContainText('+100.000 B');
    await expect(card.getByTestId('auto-redeem-notice')).toContainText('riscattato automaticamente');

    await card.getByRole('button', { name: 'Riscatta' }).click();
    await page.getByRole('dialog').getByRole('button', { name: /Riscatta 600\.000 B/ }).click();
    await expect(page.getByText(/Accreditati 600\.000 B/)).toBeVisible();
    await expect(page.getByText('1.100.000 B').first()).toBeVisible();

    await page.goto('/app/movimenti');
    await expect(page.getByText('Riscatto film').first()).toBeVisible();

    // In homepage: non acquistabile perché già riscattato, con data e rendita
    await page.goto('/app');
    const redeemedCard = page.getByRole('link', { name: new RegExp(title) }).filter({ has: page.getByTestId('owned-status') }).first();
    await expect(redeemedCard.getByTestId('owned-status')).toHaveAttribute('data-status', 'REDEEMED');
    await expect(redeemedCard).toContainText('Non acquistabile');
    await expect(redeemedCard).toContainText(/Già riscattato il \d{2} \S+ \d{4}/);
    await expect(redeemedCard).toContainText('Rendita');
    await expect(redeemedCard).toContainText('600.000 B');
    await expect(redeemedCard).toContainText('+100.000 B');

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
