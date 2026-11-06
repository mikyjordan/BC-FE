import { expect, test } from '@playwright/test';
import { login, registerNewUser, SUPERADMIN } from './helpers';

test('il Superadmin elimina un utente con tutte le sue transazioni, dopo aver confermato il nome utente', async ({ page, browser }) => {
  const userPage = await browser.newPage();
  const user = await registerNewUser(userPage);
  await userPage.close();

  await login(page, SUPERADMIN.email, SUPERADMIN.password);
  await page.goto('/admin/utenti');
  await page.getByLabel('Cerca utenti').fill(user.username);
  await page.getByLabel('Cerca utenti').press('Enter');
  await expect(page.getByRole('cell', { name: new RegExp(user.username) }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: `Rettifica saldo di ${user.username}` })).toBeVisible();

  await page.getByRole('button', { name: `Elimina ${user.username}` }).click();
  const modal = page.getByTestId('delete-user-modal');
  await expect(modal).toContainText('irreversibile');
  await expect(modal).toContainText('1.000.000 B');
  await expect(modal).toContainText('Transazioni: 1');
  const confirm = modal.getByRole('button', { name: 'Elimina definitivamente' });
  await expect(confirm).toBeDisabled();
  await modal.getByLabel(`Per confermare scrivi il nome utente: ${user.username}`).fill(user.username);
  await confirm.click();

  await expect(page.getByText(`Utente ${user.username} eliminato con tutte le sue transazioni.`)).toBeVisible();
  await expect(page.getByRole('cell', { name: new RegExp(user.username) })).toHaveCount(0);
});
