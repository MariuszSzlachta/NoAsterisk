import { expect, test } from '@playwright/test';
import { setupAuthenticatedUser, unlockVault } from '../helpers/auth';

test.describe('Budgets Page — CRUD E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page);
    await page.goto('/budgets');
    await unlockVault(page);
  });

  test('renders budgets page with KPI row and filters', async ({ page }) => {
    await expect(page.getByText('Zaplanowano')).toBeVisible();
    await expect(page.getByText('Wydano')).toBeVisible();
    await expect(page.getByText('Pozostało')).toBeVisible();
    await expect(page.getByText('Miesiąc')).toBeVisible();
  });

  test('shows empty state when no budgets', async ({ page }) => {
    await expect(page.getByText('Brak budżetów')).toBeVisible();
  });

  test('creates a savings budget via form', async ({ page }) => {
    await page.getByRole('button', { name: 'Utwórz budżet oszczędnościowy' }).click();

    // Modal should open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Nowy budżet')).toBeVisible();

    // Fill form
    await page.getByLabel('Nazwa budżetu').fill('Wakacje 2027');
    await page.getByLabel(/Cel oszczędności/).fill('15000');

    // Submit
    await page.getByRole('button', { name: 'Utwórz' }).click();

    // Modal should close and savings card should appear
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('Wakacje 2027')).toBeVisible();
  });

  test('validates form — shows error for missing name', async ({ page }) => {
    await page.getByRole('button', { name: 'Utwórz budżet oszczędnościowy' }).click();

    // Submit without filling
    await page.getByRole('button', { name: 'Utwórz' }).click();

    // Error should be visible (name required)
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('closes form modal with cancel button', async ({ page }) => {
    await page.getByRole('button', { name: 'Utwórz budżet oszczędnościowy' }).click();

    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: 'Anuluj' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('filter tabs switch between monthly and yearly', async ({ page }) => {
    // Click yearly tab
    await page.getByRole('button', { name: 'Rok' }).click();

    // Should still show empty state (no yearly budgets)
    await expect(page.getByText('Brak budżetów')).toBeVisible();
  });

  test('savings section shows empty state', async ({ page }) => {
    await expect(page.getByText('Nie masz jeszcze budżetu oszczędnościowego.')).toBeVisible();
  });

  test('creates savings budget and shows progress toward goal', async ({ page }) => {
    await page.getByRole('button', { name: 'Utwórz budżet oszczędnościowy' }).click();

    await page.getByLabel('Nazwa budżetu').fill('Fundusz awaryjny');
    await page.getByLabel(/Cel oszczędności/).fill('10000');
    await page.getByRole('button', { name: 'Utwórz' }).click();

    // Savings card should show
    await expect(page.getByText('Fundusz awaryjny')).toBeVisible();
    await expect(page.getByText('0% celu')).toBeVisible();
  });
});
