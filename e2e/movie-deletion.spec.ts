import { expect, test, type APIRequestContext } from '@playwright/test';
import { API_URL, login, registerNewUser, SUPERADMIN, uid } from './helpers';

/** Giorno di calendario in Italia a N giorni da oggi, "AAAA-MM-GG". */
const italianDay = (days = 0) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date(Date.now() + days * 86_400_000));

/** Film pubblicato e acquistabile, preparato via API dal Superadmin. */
async function publishedMovie(request: APIRequestContext, title: string, priceBc: number) {
  const { accessToken } = await (await request.post(`${API_URL}/api/v1/auth/login`, { data: SUPERADMIN })).json();
  const headers = { Authorization: `Bearer ${accessToken}`, 'X-Requested-With': 'e2e' };
  const movie = await (await request.post(`${API_URL}/api/v1/admin/movies`, { headers, data: { title, genres: ['Dramma'] } })).json();
  const rules = await request.put(`${API_URL}/api/v1/admin/movies/${movie.id}/rules`, {
    headers,
    data: { italianReleaseDate: italianDay(10), priceBc, autoRedeemAt: null, showOnHomepage: true, showInLeaderboards: true },
  });
  expect(rules.ok()).toBeTruthy();
  expect((await request.post(`${API_URL}/api/v1/admin/movies/${movie.id}/publish`, { headers })).ok()).toBeTruthy();
  return movie.id as string;
}

test('cancellando un film i possessori vengono rimborsati e vedono lo stato "Rimborsato"', async ({ page, browser, request }) => {
  const title = `E2E Da cancellare ${uid()}`;
  const movieId = await publishedMovie(request, title, 300_000);

  // L'utente compra il film: stato "Acquistato"
  await registerNewUser(page);
  await page.goto(`/app/film/${movieId}`);
  await page.getByRole('button', { name: 'Acquista' }).click();
  await page.getByRole('button', { name: /Conferma 300\.000 B/ }).click();
  await expect(page.getByTestId('holding-status').first()).toHaveAttribute('data-phase', 'ACQUISTATO');
  await page.goto('/app/portafoglio');
  await expect(page.getByText('700.000 B').first()).toBeVisible();

  // Il Superadmin cancella il film dalla sua scheda, scrivendo il titolo per conferma
  const admin = await browser.newPage();
  await login(admin, SUPERADMIN.email, SUPERADMIN.password);
  await admin.goto(`/admin/contenuti/movies/${movieId}`);
  await admin.getByTestId('movie-deletion').getByRole('button', { name: /Cancella il film/ }).click();
  const modal = admin.getByTestId('delete-movie-modal');
  await expect(modal.getByTestId('refund-summary')).toContainText('1 utenti lo possiedono');
  await expect(modal.getByTestId('refund-summary')).toContainText('300.000 B');
  const confirm = modal.getByRole('button', { name: 'Cancella e rimborsa' });
  await expect(confirm).toBeDisabled();
  await modal.getByLabel(/Per confermare scrivi il titolo/).fill(title);
  await confirm.click();
  await expect(admin).toHaveURL(/\/admin\/pubblicazione/);
  await admin.getByPlaceholder('Cerca per titolo…').fill(title);
  await admin.keyboard.press('Enter');
  await expect(admin.getByText(title)).toHaveCount(0);
  await admin.close();

  // L'utente ha di nuovo il saldo pieno e vede il film come "Rimborsato"
  await page.reload();
  await expect(page.getByText('1.000.000 B').first()).toBeVisible();
  await page.getByRole('tab', { name: 'Rimborsati' }).or(page.getByRole('button', { name: 'Rimborsati' })).click();
  const card = page.getByRole('article', { name: `Film ${title}` });
  await expect(card.getByTestId('holding-status')).toHaveAttribute('data-phase', 'RIMBORSATO');
  await expect(card).toContainText('Rimborsato');
  await expect(card).toContainText(/Film cancellato: il \d{2} \S+ \d{4} ti sono stati restituiti 300\.000 B/);
  await expect(card.getByRole('button', { name: 'Riscatta' })).toHaveCount(0);

  await page.goto('/app/movimenti');
  await expect(page.getByText(`Rimborso — film cancellato: ${title}`)).toBeVisible();
});
