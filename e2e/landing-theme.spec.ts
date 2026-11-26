import { expect, test } from '@playwright/test';
import { API_URL, login, SUPERADMIN } from './helpers';

const headerBg = (page: import('@playwright/test').Page) => page.locator('header').first().evaluate((el) => getComputedStyle(el).backgroundImage);

test('la pagina iniziale spiega cosa si può fare, senza login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const features = page.getByTestId('landing-features');
  await expect(features.getByRole('heading', { name: 'Ricevi Bustercoin' })).toBeVisible();
  await expect(features.getByRole('heading', { name: 'Compra i film in uscita' })).toBeVisible();
  await expect(features.getByRole('heading', { name: 'Riscatta il guadagno' })).toBeVisible();
  // Nessuna azione di gioco: solo registrazione e accesso
  await expect(page.getByRole('button', { name: /Acquista|Riscatta/ })).toHaveCount(0);
  await page.getByTestId('landing-register').click();
  await expect(page).toHaveURL(/\/registrazione$/);
});

test.describe.serial('Colori del sito', () => {
  test.afterAll(async ({ request }) => {
    const res = await request.post(`${API_URL}/api/v1/auth/login`, { data: SUPERADMIN });
    const { accessToken } = await res.json();
    await request.delete(`${API_URL}/api/v1/admin/settings/theme`, { headers: { Authorization: `Bearer ${accessToken}` } });
  });

  test('il Superadmin cambia un colore per tutti e poi ripristina i default', async ({ page, browser }) => {
    await login(page, SUPERADMIN.email, SUPERADMIN.password);
    await page.goto('/admin/impostazioni');
    const card = page.getByTestId('theme-colors');
    await expect(card).toBeVisible();
    const before = await headerBg(page);

    await card.getByTestId('color-brand').fill('#0A8F3C');
    // anteprima immediata per chi modifica
    await expect.poll(() => headerBg(page)).toContain('rgb(10, 143, 60)');
    await card.getByTestId('theme-save').click();
    await expect(card.getByText('Colori salvati')).toBeVisible();

    // un visitatore vede subito i nuovi colori
    const anon = await (await browser.newContext()).newPage();
    await anon.goto('/');
    await expect.poll(() => headerBg(anon)).toContain('rgb(10, 143, 60)');

    // un colore non valido non si può salvare
    await card.getByTestId('color-text').fill('rosso; background: url(x)');
    await expect(card.getByTestId('theme-save')).toBeDisabled();
    await card.getByRole('button', { name: 'Annulla modifiche' }).click();

    await card.getByTestId('theme-reset').click();
    await page.getByRole('dialog').getByRole('button', { name: 'Ripristina colori di default' }).click();
    await expect(card.getByText('Colori di default ripristinati')).toBeVisible();
    await expect.poll(() => headerBg(page)).toBe(before);
  });
});
