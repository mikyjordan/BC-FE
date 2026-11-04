import { expect, test } from '@playwright/test';
import { registerNewUser } from './helpers';

test('mobile: navigazione inferiore e pagine principali raggiungibili', async ({ page }) => {
  await registerNewUser(page);
  const nav = page.getByRole('navigation', { name: 'Navigazione', exact: true });
  await expect(nav).toBeVisible();
  for (const [label, url, heading] of [
    ['Film', /\/app\/film$/, 'Film'],
    ['Portafoglio', /\/app\/portafoglio$/, 'Portafoglio'],
    ['Classifiche', /\/app\/classifiche$/, 'Classifiche'],
    ['Profilo', /\/app\/profilo$/, 'Profilo'],
  ] as const) {
    await nav.getByRole('link', { name: label }).click();
    await expect(page).toHaveURL(url);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  }
  // Nessuno scroll orizzontale indesiderato
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
