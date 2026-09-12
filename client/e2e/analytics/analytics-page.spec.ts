import { test, expect } from '@playwright/test';

import { setupAuthenticatedUser, unlockVault } from '../helpers/auth';

test.describe('Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedUser(page, 'Member');
    await page.goto('/analytics');
    await unlockVault(page);
  });

  test('renders toolbar with metric buttons', async ({ page }) => {
    const metricsGroup = page.getByRole('group', { name: 'Metryki' });
    await expect(metricsGroup).toBeVisible();

    const buttons = metricsGroup.locator('button');
    await expect(buttons).toHaveCount(4);
  });

  test('expenses metric is active by default', async ({ page }) => {
    const expBtn = page.getByRole('button', { name: /wydatki/i });
    await expect(expBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('clicking metric toggles it on', async ({ page }) => {
    const incomeBtn = page.getByRole('button', { name: /przychody/i });
    await incomeBtn.click();
    await expect(incomeBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('renders KPI cards', async ({ page }) => {
    // Target the KPI content rather than the responsive toolbar's hidden
    // mobile grid, which also uses the generic `grid` class.
    await expect(page.locator('.kpi-label').first()).toBeVisible();
  });

  test('period buttons switch chart range', async ({ page }) => {
    const periodGroup = page.getByRole('group', { name: 'Okres' });
    const btn1m = periodGroup.getByRole('button', { name: '1M' });
    await btn1m.click();
    await expect(btn1m).toHaveAttribute('aria-pressed', 'true');
  });

  test('chart type buttons switch visualization', async ({ page }) => {
    const chartGroup = page.getByRole('group', { name: 'Typ wykresu' });
    const barBtn = chartGroup.getByRole('button', { name: /słupkowy/i });
    await barBtn.click();
    await expect(barBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('granularity buttons change bucket size', async ({ page }) => {
    const granGroup = page.getByRole('group', { name: 'Granularność' });
    const weeklyBtn = granGroup.getByRole('button', { name: /tygodniowo/i });
    await weeklyBtn.click();
    await expect(weeklyBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('category breakdown section is visible', async ({ page }) => {
    // Look for breakdown heading
    await expect(page.getByText(/wydatki wg kategorii/i)).toBeVisible();
  });

  test('clicking category opens drilldown panel', async ({ page }) => {
    // If there are categories, clicking one should expand a panel
    const categoryButtons = page.locator('button[aria-controls="category-drilldown-panel"]');
    const count = await categoryButtons.count();

    if (count > 0) {
      await categoryButtons.first().click();
      await expect(categoryButtons.first()).toHaveAttribute('aria-expanded', 'true');

      // Drilldown panel should appear
      const drilldown = page.locator('#category-drilldown-panel');
      await expect(drilldown).toBeVisible();
    }
  });

  test('closing drilldown collapses the panel', async ({ page }) => {
    const categoryButtons = page.locator('button[aria-controls="category-drilldown-panel"]');
    const count = await categoryButtons.count();

    if (count > 0) {
      await categoryButtons.first().click();

      const closeBtn = page.getByRole('button', { name: /zamknij/i });
      await closeBtn.click();

      await expect(categoryButtons.first()).toHaveAttribute('aria-expanded', 'false');
    }
  });

  test('URL param ?metric=income,expenses activates both metrics', async ({ page }) => {
    await page.goto('/analytics?metric=income,expenses');
    await unlockVault(page);

    const incomeBtn = page.getByRole('button', { name: /przychody/i });
    const expensesBtn = page.getByRole('button', { name: /wydatki/i });

    await expect(incomeBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(expensesBtn).toHaveAttribute('aria-pressed', 'true');
  });
});
