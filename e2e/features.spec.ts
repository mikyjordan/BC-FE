import { expect, test } from '@playwright/test';
import { login, registerNewUser, SUPERADMIN, API_URL } from './helpers';

test.describe.serial('Sezioni attivabili dal Superadmin', () => {
  // Qualunque esito, la sezione viene riattivata per non influenzare gli altri test.
  test.afterAll(async ({ request }) => {
    const res = await request.post(`${API_URL}/api/v1/auth/login`, { data: SUPERADMIN });
    const { accessToken } = await res.json();
    await request.put(`${API_URL}/api/v1/admin/settings/features`, { headers: { Authorization: `Bearer ${accessToken}` }, data: { movies: true, tvSeries: true } });
  });

  test('disattivando Serie TV spariscono menu e pagine; riattivandola tornano', async ({ page, browser }) => {
    await login(page, SUPERADMIN.email, SUPERADMIN.password);
    await page.goto('/admin/impostazioni');
    const row = page.getByRole('region', { name: 'Sezione Serie TV' }).or(page.getByLabel('Sezione Serie TV'));
    await row.getByRole('button', { name: 'Disattiva Serie TV' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Disattiva', exact: true }).click();
    await expect(row.getByText('Disattivata')).toBeVisible();

    const userCtx = await browser.newContext();
    const u = await userCtx.newPage();
    await registerNewUser(u);
    const sidebar = u.getByRole('complementary', { name: 'Navigazione principale' });
    await expect(sidebar.getByRole('link', { name: 'Film' })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: 'Serie TV' })).toHaveCount(0);
    await u.goto('/app/serie');
    await expect(u).toHaveURL(/\/app$/);
    // Portafoglio: niente tab, voce di distribuzione o elenco delle Serie TV
    await u.goto('/app/portafoglio');
    await expect(u.getByRole('heading', { name: 'Distribuzione' })).toBeVisible();
    await expect(u.getByTestId('distribution-series')).toHaveCount(0);
    await expect(u.getByText(/Serie TV/)).toHaveCount(0);

    // Riattivazione
    await row.getByRole('button', { name: 'Attiva Serie TV' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Attiva', exact: true }).click();
    await expect(row.getByText('Attiva', { exact: true })).toBeVisible();
    await u.goto('/app');
    await u.reload();
    await expect(sidebar.getByRole('link', { name: 'Serie TV' })).toBeVisible();
    await userCtx.close();
  });
});
