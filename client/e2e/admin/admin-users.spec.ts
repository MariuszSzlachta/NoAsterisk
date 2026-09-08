import { test, expect } from '@playwright/test';

import { setupAdminApiMocks, setupAuthenticatedUser, unlockVault } from '../helpers/auth';

test.describe('Admin Users — Block/Delete Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page, 'Superuser');
    await setupAdminApiMocks(page);
    await page.goto('/admin');
    await unlockVault(page);
    // Navigate to users tab
    await page.getByRole('tab', { name: /użytkownicy/i }).click();
  });

  test('displays user list with roles', async ({ page }) => {
    await expect(page.getByText('admin@budget.pl')).toBeVisible();
    await expect(page.getByText('user@budget.pl')).toBeVisible();
    await expect(page.getByText('blocked@budget.pl')).toBeVisible();
  });

  test('search filters users by email', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/szukaj/i);
    await searchInput.fill('admin');

    await expect(page.getByText('admin@budget.pl')).toBeVisible();
    await expect(page.getByText('user@budget.pl')).not.toBeVisible();
  });

  test('block button sends PATCH request', async ({ page }) => {
    let blockCalled = false;
    await page.route('**/api/admin/users/u-2/block', (route) => {
      blockCalled = true;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'u-2', blocked: true }),
      });
    });

    // Find the block button for the member user row
    const memberRow = page.locator('tr', { hasText: 'user@budget.pl' });
    await memberRow.getByRole('button', { name: /zablokuj|block/i }).click();

    expect(blockCalled).toBe(true);
  });

  test('delete flow shows confirmation modal', async ({ page }) => {
    const memberRow = page.locator('tr', { hasText: 'user@budget.pl' });
    await memberRow.getByRole('button', { name: /usuń|delete/i }).click();

    // Confirmation modal appears
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/na pewno/i)).toBeVisible();
  });

  test('confirming delete sends DELETE request', async ({ page }) => {
    let deleteCalled = false;
    await page.route('**/api/admin/users/u-2', (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'u-2', deleted: true }),
        });
      }
      return route.continue();
    });

    const memberRow = page.locator('tr', { hasText: 'user@budget.pl' });
    await memberRow.getByRole('button', { name: /usuń|delete/i }).click();

    // Click confirm in modal
    await page.getByRole('dialog').getByRole('button', { name: /usuń|delete/i }).click();

    expect(deleteCalled).toBe(true);
  });

  test('canceling delete closes modal', async ({ page }) => {
    const memberRow = page.locator('tr', { hasText: 'user@budget.pl' });
    await memberRow.getByRole('button', { name: /usuń|delete/i }).click();

    await page.getByRole('dialog').getByRole('button', { name: /anuluj|cancel/i }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});
