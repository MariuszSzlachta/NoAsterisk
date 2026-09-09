import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { setupAuthenticatedUser, unlockVault } from '../helpers/auth';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.resolve(__dirname, '../fixtures');

test.describe('Import CSV — Step 2: Column Mapping', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page, 'Member', { unlock: false });
    await page.goto('/import');
    await unlockVault(page);

    // Upload a file to get to step 2
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'generic-sample.csv'));
    await page.getByRole('button', { name: 'Dalej' }).click();

    // Verify we're on step 2
    const stepper = page.locator('nav[aria-label="Postęp"]');
    const activeStep = stepper.locator('[aria-current="step"]');
    await expect(activeStep).toHaveText('2');
  });

  test('shows mapping heading and description', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Mapowanie kolumn' })).toBeVisible();
    await expect(page.getByText('Sprawdź podgląd surowych danych')).toBeVisible();
  });

  test('shows data preview table with CSV headers', async ({ page }) => {
    // Table with CSV column headers
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'date' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'description' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'amount' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'currency' })).toBeVisible();
  });

  test('shows data preview with first rows of CSV data', async ({ page }) => {
    // First row data
    await expect(page.getByRole('cell', { name: '2025-06-15' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Salary payment' })).toBeVisible();
    await expect(page.getByRole('cell', { name: '8500.00' })).toBeVisible();
  });

  test('shows field assignment section with all CSV columns', async ({ page }) => {
    await expect(page.getByText('Przypisanie pól')).toBeVisible();

    // Each CSV column should appear as assignment row
    await expect(page.getByText('date').first()).toBeVisible();
    await expect(page.getByText('description').first()).toBeVisible();
    await expect(page.getByText('amount').first()).toBeVisible();
    await expect(page.getByText('currency').first()).toBeVisible();
  });

  test('shows example values in assignment rows', async ({ page }) => {
    const exampleLabels = page.getByText('przykład');
    await expect(exampleLabels).toHaveCount(4);

    // Check that specific example values from first row are shown
    await expect(page.getByText('Salary payment').nth(1)).toBeVisible();
  });

  test('shows "kolumna CSV" and "przykład" labels', async ({ page }) => {
    const csvLabels = page.getByText('kolumna CSV');
    await expect(csvLabels.first()).toBeVisible();

    const exampleLabels = page.getByText('przykład');
    await expect(exampleLabels.first()).toBeVisible();
  });

  test('has auto-detected field mappings in selects', async ({ page }) => {
    // autoDetectMapping should have matched 'date' -> Data, 'amount' -> Kwota etc.
    // Check that at least one select shows a mapped value (has colored dot)
    const mappedSelects = page.locator('.h-2.w-2.rounded-full');
    await expect(mappedSelects.first()).toBeVisible();
  });

  test('shows save profile bar with button', async ({ page }) => {
    await expect(page.getByText('Zapisać to mapowanie jako profil')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zapisz jako...' })).toBeVisible();
  });

  test('shows "Wstecz" and "Dalej" navigation buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Wstecz' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dalej' })).toBeVisible();
  });

  test('"Wstecz" navigates back to step 1', async ({ page }) => {
    await page.getByRole('button', { name: 'Wstecz' }).click();

    const stepper = page.locator('nav[aria-label="Postęp"]');
    const activeStep = stepper.locator('[aria-current="step"]');
    await expect(activeStep).toHaveText('1');
  });

  test('can change field mapping via select dropdown', async ({ page }) => {
    // Find first combobox and change its value
    const firstSelect = page.getByRole('combobox').first();
    await firstSelect.click();

    // Select a different field
    const option = page.getByRole('option', { name: 'Kwota' });
    await option.click();

    // Verify the select now shows "Kwota"
    await expect(firstSelect).toContainText('Kwota');
  });
});
