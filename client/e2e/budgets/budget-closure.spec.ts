import { expect, test } from '@playwright/test';
import { setupAuthenticatedUser, unlockVault } from '../helpers/auth';

test.describe('Budgets Page — Period Closure & Savings E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page, 'Superuser', { unlock: false });

    // Seed legacy localStorage before the first vault unlock so the migration
    // path is exercised instead of bypassed by an already-created metadata row.
    const standardBudgetId = 'e2e-budget-std';
    const savingsBudgetId = 'e2e-budget-sav';

    const budgetsState = {
      state: {
        budgets: [
          {
            id: standardBudgetId,
            workspaceId: 'ws-1',
            budgetType: 'standard',
            name: 'Zakupy spożywcze',
            color: '#34d399',
            limitAmount: 2000,
            limitCurrency: 'PLN',
            period: { type: 'custom', dateFrom: '2025-01-01', dateTo: '2025-01-31' },
            categoryIds: [],
            createdAt: '2025-01-01T00:00:00.000Z',
            isArchived: false,
          },
          {
            id: savingsBudgetId,
            workspaceId: 'ws-1',
            budgetType: 'savings',
            name: 'Wakacje',
            color: '#10b981',
            limitAmount: 10000,
            limitCurrency: 'PLN',
            period: null,
            categoryIds: [],
            createdAt: '2025-01-01T00:00:00.000Z',
            isArchived: false,
          },
        ],
      },
      version: 0,
    };

    const historyState = {
      state: { history: [] },
      version: 0,
    };

    await page.addInitScript((data) => {
      localStorage.setItem('budget-budgets', JSON.stringify(data.budgets));
      localStorage.setItem('budget-period-history', JSON.stringify(data.history));
    }, { budgets: budgetsState, history: historyState });

    await page.goto('/budgets');
    await unlockVault(page);
  });

  test('shows budget card with awaiting closure status for past period', async ({ page }) => {
    // The budget has a past period (Jan 2025) so it should show awaitingClosure
    // Switch to custom period filter to see it
    await page.getByRole('button', { name: 'Własny' }).click();

    // The seeded budget should show "Wymaga zamknięcia" badge
    await expect(page.getByText('Zakupy spożywcze')).toBeVisible();
    await expect(page.getByText('Wymaga zamknięcia')).toBeVisible();
  });

  test('opens period closure modal when clicking close period button', async ({ page }) => {
    await page.getByRole('button', { name: 'Własny' }).click();

    // Click the close period button on the awaiting closure banner
    await page.getByText('Zamknij okres').click();

    // Closure modal should open
    await expect(page.getByText('Zamknij okres: Zakupy spożywcze')).toBeVisible();
    await expect(page.getByText('Limit')).toBeVisible();
    await expect(page.getByText('Przenieś na następny okres')).toBeVisible();
  });

  test('can close period with carry forward option', async ({ page }) => {
    await page.getByRole('button', { name: 'Własny' }).click();
    await page.getByText('Zamknij okres').click();

    // Carry forward should be pre-selected
    const carryInput = page.getByRole('radio', { name: /Przenieś na następny okres/ });
    await expect(carryInput).toBeChecked();

    // Submit
    await page.getByRole('button', { name: 'Zamknij okres' }).click();

    // Modal should close
    await expect(page.getByText('Zamknij okres: Zakupy spożywcze')).not.toBeVisible();
  });

  test('can select savings rollover option and pick target', async ({ page }) => {
    await page.getByRole('button', { name: 'Własny' }).click();
    await page.getByText('Zamknij okres').click();

    // Select savings option
    await page.getByText('Przenieś do oszczędności').click();

    // Savings dropdown should appear
    await expect(page.getByText('Wybierz budżet oszczędnościowy')).toBeVisible();
  });

  test('savings budget card is visible with correct name', async ({ page }) => {
    await expect(page.getByText('Wakacje')).toBeVisible();
    await expect(page.getByText('Budżet oszczędnościowy')).toBeVisible();
  });

  test('cancel button closes the closure modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Własny' }).click();
    await page.getByText('Zamknij okres').click();

    await page.getByRole('button', { name: 'Anuluj' }).click();

    await expect(page.getByText('Zamknij okres: Zakupy spożywcze')).not.toBeVisible();
  });
});
