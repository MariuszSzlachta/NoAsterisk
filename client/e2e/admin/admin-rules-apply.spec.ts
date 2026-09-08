import { test, expect } from '@playwright/test';

import { setupAuthenticatedUser, unlockVault } from '../helpers/auth';

test.describe('Admin Rules — Apply to Transactions', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page, 'Superuser');
    await page.goto('/admin/rules');
    await unlockVault(page);
  });

  test('apply rules button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /zastosuj reguły/i })).toBeVisible();
  });

  test('apply rules with no rules shows zero result', async ({ page }) => {
    await page.getByRole('button', { name: /zastosuj reguły/i }).click();

    // Should show result message (0 categorized of N total)
    await expect(page.getByText(/skategoryzowano/i)).toBeVisible();
    await expect(page.getByText(/0/)).toBeVisible();
  });

  test('apply rules after creating rule shows categorization result', async ({ page }) => {
    // First add some transactions via navigation to /transactions (state is local)
    // For this test, we just verify the flow works with existing zustand state

    // Create a rule
    await page.getByRole('button', { name: /dodaj regułę/i }).click();
    await page.getByPlaceholder(/biedronka/i).fill('BIEDRONKA');
    const categorySelect = page.locator('#rule-category');
    await categorySelect.click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: /dodaj$/i }).click();

    // Apply
    await page.getByRole('button', { name: /zastosuj reguły/i }).click();

    // Result message should appear
    await expect(page.getByText(/skategoryzowano/i)).toBeVisible();
  });
});
