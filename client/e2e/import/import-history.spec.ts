import { expect, test } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { setupAuthenticatedUser, unlockVault } from '../helpers/auth';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.resolve(__dirname, '../fixtures/generic-sample.csv');

test.describe('Local import history', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page, 'Member', { unlock: false });
    await page.goto('/import-history');
    await unlockVault(page);
  });

  test('shows the empty state and local import action', async ({ page }) => {
    await expect(page.locator('main').getByRole('heading', { name: 'Historia importów' }).last()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Brak importów' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Rozpocznij import' })).toHaveAttribute('href', '/import');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await unlockVault(page);
    await page.screenshot({ path: '/private/tmp/session-04-import-history-mobile-empty.png', fullPage: true });
  });

  test('creates two records for duplicate filenames and deletes one batch', async ({ page }) => {
    await page.getByRole('link', { name: 'Rozpocznij import' }).click();
    await page.locator('input[type="file"]').setInputFiles(FIXTURE);
    await page.getByRole('button', { name: 'Dalej' }).click();
    await page.getByRole('button', { name: 'Dalej' }).click();
    await expect(page.locator('nav[aria-label="Postęp"]').locator('[aria-current="step"]')).toHaveText('3');
    await page.getByRole('button', { name: 'Dalej' }).click();
    await expect(page.locator('nav[aria-label="Postęp"]').locator('[aria-current="step"]')).toHaveText('4');
    await page.getByRole('button', { name: /Dalej — importuj/ }).click();
    await page.getByRole('button', { name: 'Importuj transakcje' }).click();

    await page.getByRole('link', { name: 'Historia importów' }).click();
    await expect(page).toHaveURL(/\/import-history$/);
    await expect(page.getByRole('heading', { name: 'generic-sample.csv' })).toHaveCount(1);

    await page.getByRole('link', { name: 'Importuj CSV' }).last().click();
    await page.locator('input[type="file"]').setInputFiles(FIXTURE);
    await page.getByRole('button', { name: 'Dalej' }).click();
    await page.getByRole('button', { name: 'Dalej' }).click();
    await page.getByRole('button', { name: 'Dalej' }).click();
    await page.getByRole('button', { name: /Dalej — importuj/ }).click();
    await page.getByRole('button', { name: 'Importuj transakcje' }).click();
    await page.getByRole('link', { name: 'Historia importów' }).click();

    await expect(page.getByRole('heading', { name: 'generic-sample.csv' })).toHaveCount(2);
    await page.getByRole('button', { name: 'Usuń import generic-sample.csv' }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/Spowoduje to usunięcie.*wszystkich transakcji/)).toBeVisible();
    await page.screenshot({ path: '/private/tmp/session-04-import-history-desktop-delete-dialog.png', fullPage: true });
    await page.getByRole('dialog').getByRole('button', { name: 'Usuń import', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'generic-sample.csv' })).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Brak importów' })).not.toBeVisible();
  });
});
