import { expect, test } from '@playwright/test';
import { login, SUPERADMIN, uid } from './helpers';

/** Data e ora in Italia fra N minuti: ["AAAA-MM-GG", "HH:MM"]. */
function italianInMinutes(minutes: number): [string, string] {
  const at = new Date(Date.now() + minutes * 60_000);
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(at);
  const time = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(at);
  return [day, time];
}

test('la pubblicazione programmata avviene da sola all’orario indicato e la pagina si aggiorna', async ({ page }) => {
  test.setTimeout(150_000);
  const title = `E2E Programmato ${uid()}`;
  await login(page, SUPERADMIN.email, SUPERADMIN.password);
  await page.goto('/admin/pubblicazione');
  await page.getByRole('button', { name: 'Nuovo film' }).click();
  await page.getByLabel('Titolo *').fill(title);
  await page.getByRole('button', { name: 'Crea in bozza' }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();

  const [day, time] = italianInMinutes(1);
  const schedule = page.getByTestId('schedule-publication');
  await schedule.getByLabel('Programma la pubblicazione').fill(day);
  await schedule.getByLabel('Ora', { exact: true }).fill(time);
  await schedule.getByRole('button', { name: 'Programma pubblicazione' }).click();
  await expect(page.getByText(`Pubblicazione automatica programmata per`)).toBeVisible();

  // Nessun clic e nessun ricaricamento: all'orario il titolo risulta pubblicato
  await expect(page.getByText('Pubblicato', { exact: true }).first()).toBeVisible({ timeout: 100_000 });
  await expect(page.getByText('Pubblicazione automatica programmata per')).toHaveCount(0);
});
