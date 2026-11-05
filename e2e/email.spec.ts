import { expect, test } from '@playwright/test';
import { login, logout, mailsTo, SUPERADMIN, uid, verificationPath, registerNewUser } from './helpers';

test.describe('Email', () => {
  test('la registrazione va confermata dal link ricevuto via email', async ({ page }) => {
    const id = uid();
    const user = { email: `conf_${id}@test.local`, username: `conf_${id}`, password: 'Password1234' };
    await page.goto('/registrazione');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Nome utente').fill(user.username);
    await page.getByLabel('Password', { exact: true }).fill(user.password);
    await page.getByLabel('Conferma password').fill(user.password);
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Registrati' }).click();
    await expect(page.getByRole('heading', { name: 'Controlla la tua email' })).toBeVisible();
    await expect(page.getByTestId('registration-pending')).toContainText(user.email);

    // email HTML ricevuta
    const link = await verificationPath(user.email);
    const mail = mailsTo(user.email)[0];
    expect(mail).toContain('Conferma il tuo indirizzo email su BusterCinema');
    expect(mail).toContain(`Benvenuto, ${user.username}!`);

    // prima della conferma non si entra: compare il reinvio del link
    await page.goto('/login');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password', { exact: true }).fill(user.password);
    await page.getByRole('button', { name: 'Accedi' }).click();
    await expect(page.getByText('Conferma il tuo indirizzo email per accedere')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reinvia email di conferma' })).toBeVisible();

    // il link attiva l'account, accredita il bonus ed entra nell'app
    await page.goto(link);
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByTestId('welcome')).toContainText('1.000.000 Bustercoin');

    // il link è monouso
    await logout(page);
    await page.goto(link);
    await expect(page.getByRole('heading', { name: 'Email già confermata' })).toBeVisible();
  });

  test('il film aggiunto con l’avviso email viene notificato agli utenti solo alla pubblicazione', async ({ page, browser }) => {
    test.setTimeout(120_000);
    const reader = await browser.newPage();
    const user = await registerNewUser(reader);
    await reader.close();

    const title = `Avviso ${uid()}`;
    await login(page, SUPERADMIN.email, SUPERADMIN.password);
    await page.goto('/admin/contenuti/movies/nuovo');
    await page.getByLabel('Titolo *').fill(title);
    await page.getByLabel('Regista').fill('Regista Avviso');
    await page.getByTestId('create-notify').getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Crea in bozza' }).click();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByTestId('notification-section')).toContainText('partirà automaticamente quando il titolo verrà pubblicato');

    // in bozza: nessuna email
    await page.waitForTimeout(1500);
    expect(mailsTo(user.email).some((m) => m.includes(title))).toBe(false);

    // pubblicazione: la casella è già spuntata nel dialogo
    await page.getByRole('button', { name: 'Pubblica', exact: true }).first().click();
    await expect(page.getByTestId('publish-notify').getByRole('checkbox')).toBeChecked();
    await page.getByRole('dialog').getByRole('button', { name: 'Pubblica', exact: true }).click();
    await expect(page.getByTestId('notification-section')).toContainText('Avviso partito il');

    // l'email arriva (inviata dallo scheduler a blocchi)
    await expect.poll(() => mailsTo(user.email).find((m) => m.includes(`Nuovo film su BusterCinema: ${title}`)) ?? '', { timeout: 90_000 }).toContain('Regia: Regista Avviso');
  });
});
