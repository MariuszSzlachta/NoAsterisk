import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.resolve(__dirname, '../fixtures');

test.describe('Import CSV — Step 1: Upload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/import');
  });

  test('shows stepper with 5 steps, first active', async ({ page }) => {
    const stepper = page.locator('nav[aria-label="Postęp"]');
    await expect(stepper).toBeVisible();

    // 5 step labels
    const steps = stepper.locator('span').filter({ hasText: /Upload|Mapowanie|Anonimizacja|Podgląd|Import/ });
    await expect(steps).toHaveCount(5);

    // First step is active
    const activeStep = stepper.locator('[aria-current="step"]');
    await expect(activeStep).toBeVisible();
    await expect(activeStep).toHaveText('1');
  });

  test('shows upload card with heading, dropzone and security note', async ({ page }) => {
    // Heading
    await expect(page.getByRole('heading', { name: 'Importuj wyciąg bankowy' })).toBeVisible();

    // Dropzone
    await expect(page.getByText('Przeciągnij i upuść plik CSV')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Wybierz plik' })).toBeVisible();

    // Security note
    await expect(page.getByText('Dane parsowane lokalnie')).toBeVisible();
  });

  test('"Dalej" button is disabled before file upload', async ({ page }) => {
    const nextButton = page.getByRole('button', { name: 'Dalej' });
    await expect(nextButton).toBeVisible();
    await expect(nextButton).toBeDisabled();
  });

  test('uploads generic CSV and shows file info', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'generic-sample.csv'));

    // File name displayed
    await expect(page.getByText('generic-sample.csv')).toBeVisible();

    // Row count displayed
    await expect(page.getByText(/3 wierszy/)).toBeVisible();

    // Detection chips visible
    await expect(page.getByText('Kodowanie')).toBeVisible();
    await expect(page.getByText('Separator')).toBeVisible();
    await expect(page.getByText('Nagłówki')).toBeVisible();
  });

  test('uploads generic CSV and enables "Dalej" button', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'generic-sample.csv'));

    const nextButton = page.getByRole('button', { name: 'Dalej' });
    await expect(nextButton).toBeEnabled();
  });

  test('uploads mBank CSV and shows bank detection chip with checkmark', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'mbank-sample.csv'));

    // Bank chip visible (exact match to avoid filename and profile bar)
    await expect(page.getByText('mBank', { exact: true })).toBeVisible();
  });

  test('uploads mBank CSV and shows bank profile recognition bar', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'mbank-sample.csv'));

    // Profile bar
    await expect(page.getByText('Rozpoznano profil')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Użyj profilu' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dostosuj' })).toBeVisible();
  });

  test('"Usuń" resets to initial state', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'generic-sample.csv'));

    // File info visible
    await expect(page.getByText('generic-sample.csv')).toBeVisible();

    // Click remove
    await page.getByRole('button', { name: 'Usuń' }).click();

    // Back to initial state — dropzone visible, no file info
    await expect(page.getByText('Przeciągnij i upuść plik CSV')).toBeVisible();
    await expect(page.getByText('generic-sample.csv')).not.toBeVisible();

    // Dalej disabled again
    const nextButton = page.getByRole('button', { name: 'Dalej' });
    await expect(nextButton).toBeDisabled();
  });

  test('clicking "Dalej" navigates to step 2 (Mapowanie)', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'generic-sample.csv'));

    await page.getByRole('button', { name: 'Dalej' }).click();

    // Step 2 is now active
    const stepper = page.locator('nav[aria-label="Postęp"]');
    const activeStep = stepper.locator('[aria-current="step"]');
    await expect(activeStep).toHaveText('2');

    // Column mapping step content visible
    await expect(page.getByText('Mapowanie kolumn')).toBeVisible();
  });

  test('shows encoding detection chip with correct value for UTF-8 file', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'generic-sample.csv'));

    // UTF-8 or utf-8 displayed
    await expect(page.getByText(/utf-8/i)).toBeVisible();
  });

  test('shows separator detection — comma for generic CSV', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'generic-sample.csv'));

    await expect(page.getByText('Przecinek ( , )')).toBeVisible();
  });

  test('shows separator detection — semicolon for mBank CSV', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'mbank-sample.csv'));

    await expect(page.getByText('Średnik ( ; )')).toBeVisible();
  });
});
