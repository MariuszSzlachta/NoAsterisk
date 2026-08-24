import { test, expect } from '@playwright/test';

import { setupAdminApiMocks, setupAuthenticatedUser } from '../helpers/auth';

test.describe('Admin Panel — Dashboard & Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page, 'Superuser');
    await setupAdminApiMocks(page);
    await page.goto('/admin');
  });

  test('shows admin page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /panel administracyjny/i })).toBeVisible();
  });

  test('shows tab navigation with 4 tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /przegląd/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /użytkownicy/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /kody/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /słowniki/i })).toBeVisible();
  });

  test('overview tab shows dashboard panels', async ({ page }) => {
    // Dashboard should show user stats, invite codes, dictionaries panels
    await expect(page.getByText(/użytkownicy/i).first()).toBeVisible();
  });

  test('clicking users tab shows users table', async ({ page }) => {
    await page.getByRole('tab', { name: /użytkownicy/i }).click();

    await expect(page.getByText('admin@budget.pl')).toBeVisible();
    await expect(page.getByText('user@budget.pl')).toBeVisible();
  });

  test('clicking codes tab shows invite codes panel', async ({ page }) => {
    await page.getByRole('tab', { name: /kody/i }).click();

    await expect(page.getByText('ABC-123')).toBeVisible();
  });
});
