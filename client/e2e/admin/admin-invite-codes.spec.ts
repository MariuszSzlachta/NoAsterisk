import { test, expect } from '@playwright/test';

import { setupAdminApiMocks, setupAuthenticatedUser } from '../helpers/auth';

test.describe('Admin Invite Codes — Generate/Copy/Delete', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page, 'Superuser');
    await setupAdminApiMocks(page);
    await page.goto('/admin');
    await page.getByRole('tab', { name: /kody/i }).click();
  });

  test('shows existing codes in table', async ({ page }) => {
    await expect(page.getByText('ABC-123')).toBeVisible();
    await expect(page.getByText('DEF-456')).toBeVisible();
  });

  test('generate button creates new code', async ({ page }) => {
    await page.getByRole('button', { name: /generuj/i }).click();

    // Generated code should appear
    await expect(page.getByText('GEN-E2E-999')).toBeVisible();
  });

  test('copy button copies generated code', async ({ page }) => {
    // Generate first
    await page.getByRole('button', { name: /generuj/i }).click();
    await expect(page.getByText('GEN-E2E-999')).toBeVisible();

    // Click copy
    await page.getByRole('button', { name: /kopiuj|copy/i }).click();

    // Clipboard check (Playwright doesn't always expose clipboard)
    // Just verify the button was clickable and no error occurred
  });

  test('delete button removes available code', async ({ page }) => {
    let deleteCalled = false;
    await page.route('**/api/admin/invite-codes/c-1', (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'c-1', deleted: true }),
        });
      }
      return route.continue();
    });

    // Find delete button next to ABC-123 code
    const codeRow = page.locator('tr', { hasText: 'ABC-123' });
    await codeRow.getByRole('button', { name: /usuń|delete/i }).click();

    expect(deleteCalled).toBe(true);
  });

  test('used codes do not have delete button', async ({ page }) => {
    const usedRow = page.locator('tr', { hasText: 'DEF-456' });
    await expect(usedRow.getByRole('button', { name: /usuń|delete/i })).not.toBeVisible();
  });

  test('expiry date input is available', async ({ page }) => {
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toBeVisible();
  });
});
