import { expect, test } from '@playwright/test';
import { setupAuthenticatedUser, unlockVault } from '../helpers/auth';

const createV2BudgetFixtures = async (page: Parameters<typeof setupAuthenticatedUser>[0]): Promise<void> => {
  const periodDateTo = new Date();
  periodDateTo.setDate(1);
  periodDateTo.setDate(periodDateTo.getDate() - 1);
  const periodDateFrom = new Date(periodDateTo);
  periodDateFrom.setDate(periodDateFrom.getDate() - 30);
  const formatDate = (date: Date): string => date.toISOString().slice(0, 10);

  await page.getByRole('button', { name: 'Utwórz budżet', exact: true }).click();
  await page.getByRole('button', { name: 'Standardowy', exact: true }).click();
  await page.getByLabel('Nazwa budżetu').fill('Zakupy spożywcze');
  await page.getByLabel(/Limit/).fill('2000');
  await page.getByRole('button', { name: 'Własny', exact: true }).click();
  await page.getByRole('textbox', { name: 'Od', exact: true }).fill(formatDate(periodDateFrom));
  await page.getByRole('textbox', { name: 'Do', exact: true }).fill(formatDate(periodDateTo));
  await page.getByRole('button', { name: 'Utwórz', exact: true }).click();

  await page.getByRole('button', { name: 'Utwórz budżet', exact: true }).click();
  await page.getByRole('button', { name: 'Oszczędnościowy', exact: true }).click();
  await page.getByLabel('Nazwa budżetu').fill('Wakacje');
  await page.getByLabel(/Cel oszczędności/).fill('10000');
  await page.getByRole('button', { name: 'Utwórz', exact: true }).click();
};

test.describe('Budgets Page — Period Closure & Savings E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page, 'Superuser', { unlock: false });
    await page.goto('/budgets');
    await unlockVault(page);
    await createV2BudgetFixtures(page);
    await page.getByRole('tab', { name: 'Własny' }).click();
    await page.getByRole('button', { name: 'Wybierz zakres dat' }).click();
    await page.getByRole('button', { name: 'Ostatni miesiąc' }).click();
  });

  test('shows budget card with awaiting closure status for past period', async ({ page }) => {
    // The budget has a past period (Jan 2025) so it should show awaitingClosure
    // Switch to custom period filter to see it
    // The seeded budget should show "Wymaga zamknięcia" badge
    await expect(page.getByText('Zakupy spożywcze')).toBeVisible();
    await expect(page.getByText('Wymaga zamknięcia')).toBeVisible();
  });

  test('opens period closure modal when clicking close period button', async ({ page }) => {
    // Click the close period button on the awaiting closure banner
    await page.getByText('Zamknij okres').click();

    // Closure modal should open
    await expect(page.getByText('Zamknij okres: Zakupy spożywcze')).toBeVisible();
    await expect(page.getByText('Limit', { exact: true })).toBeVisible();
    await expect(page.getByText('Przenieś na następny okres')).toBeVisible();
  });

  test('can close period with carry forward option', async ({ page }) => {
    await page.getByText('Zamknij okres').click();

    // Carry forward should be pre-selected
    const carryInput = page.getByRole('radio', { name: /Przenieś na następny okres/ });
    await expect(carryInput).toBeChecked();

    // Submit
    await page.getByLabel('Zamknij okres: Zakupy spożywcze').getByRole('button', { name: 'Zamknij okres', exact: true }).click();

    // Modal should close
    await expect(page.getByText('Zamknij okres: Zakupy spożywcze')).not.toBeVisible();
  });

  test('can select savings rollover option and pick target', async ({ page }) => {
    await page.getByText('Zamknij okres').click();

    // Select savings option
    await page.getByText('Przenieś do oszczędności').click();

    // Savings dropdown should appear
    await expect(page.getByText('Wybierz budżet oszczędnościowy')).toBeVisible();
  });

  test('savings budget card is visible with correct name', async ({ page }) => {
    await expect(page.getByText('Wakacje')).toBeVisible();
    await expect(page.getByText('Budżet oszczędnościowy', { exact: true })).toBeVisible();
  });

  test('cancel button closes the closure modal', async ({ page }) => {
    await page.getByText('Zamknij okres').click();

    await page.getByLabel('Zamknij okres: Zakupy spożywcze').getByText('Anuluj', { exact: true }).click();

    await expect(page.getByText('Zamknij okres: Zakupy spożywcze')).not.toBeVisible();
  });
});
