import { test, expect } from '@playwright/test';

import { setupAuthenticatedUser, unlockVault } from '../helpers/auth';

test.describe('Admin Rules — CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page, 'Superuser');

    // Mock profile for role check
    await page.route('**/api/users/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-e2e',
          email: 'admin@budget.local',
          role: 'Superuser',
          workspaceId: 'workspace-e2e',
          preferences: { language: 'pl', currency: 'PLN', theme: 'dark' },
        }),
      }),
    );

    await page.goto('/admin/rules');
    await unlockVault(page);
  });

  test('shows empty state when no rules', async ({ page }) => {
    await expect(page.getByText(/brak reguł/i)).toBeVisible();
  });

  test('shows add rule button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /dodaj regułę/i })).toBeVisible();
  });

  test('create rule flow: fill form → submit → appears in table', async ({ page }) => {
    // Open form
    await page.getByRole('button', { name: /dodaj regułę/i }).click();

    // Fill keyword
    const keywordInput = page.getByPlaceholder(/biedronka/i);
    await keywordInput.fill('LIDL');

    // Select category (open select, pick option)
    const categorySelect = page.locator('#rule-category');
    await categorySelect.click();
    await page.getByRole('option').first().click();

    // Submit
    await page.getByRole('button', { name: /dodaj$/i }).click();

    // Rule appears in table
    await expect(page.getByRole('table').getByText('LIDL')).toBeVisible();
  });

  test('edit rule flow: click edit → form shows values → save', async ({ page }) => {
    // First create a rule
    await page.getByRole('button', { name: /dodaj regułę/i }).click();
    const keywordInput = page.getByPlaceholder(/biedronka/i);
    await keywordInput.fill('UBER');
    const categorySelect = page.locator('#rule-category');
    await categorySelect.click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: /dodaj$/i }).click();

    // Now edit it
    await page.getByRole('button', { name: /edytuj regułę uber/i }).click();

    // Form should be pre-filled
    const editInput = page.getByPlaceholder(/biedronka/i);
    await expect(editInput).toHaveValue('UBER');

    // Change keyword
    await editInput.clear();
    await editInput.fill('BOLT');
    await page.getByRole('button', { name: /zapisz/i }).click();

    // Updated in table
    await expect(page.getByRole('table').getByText('BOLT')).toBeVisible();
    await expect(page.getByRole('table').getByText('UBER')).not.toBeVisible();
  });

  test('delete rule flow: click delete → removed from table', async ({ page }) => {
    // Create rule
    await page.getByRole('button', { name: /dodaj regułę/i }).click();
    await page.getByPlaceholder(/biedronka/i).fill('NETFLIX');
    const categorySelect = page.locator('#rule-category');
    await categorySelect.click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: /dodaj$/i }).click();

    // Verify it's there
    await expect(page.getByRole('table').getByText('NETFLIX')).toBeVisible();

    // Delete
    await page.getByRole('button', { name: /usuń regułę netflix/i }).click();
    await page.getByRole('dialog').getByRole('button', { name: /usuń|delete/i }).click();

    // Gone
    await expect(page.getByRole('table').getByText('NETFLIX')).not.toBeVisible();
    await expect(page.getByText(/brak reguł/i)).toBeVisible();
  });
});
