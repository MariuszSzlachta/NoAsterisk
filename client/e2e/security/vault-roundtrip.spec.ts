import { expect, test } from '@playwright/test';

import { setupAuthenticatedUser, unlockVault } from '../helpers/auth';

const LEGACY_SOURCES = {
  'budget-transactions': JSON.stringify({
    state: {
      transactions: [
        {
          id: 'e2e-transaction',
          date: '2026-09-09',
          description: 'Sensitive Merchant',
          amount: -12.5,
          currency: 'PLN',
          contentHash: 'e2e-transaction-hash',
          batchId: 'manual',
          importedAt: '2026-09-09T10:00:00.000Z',
        },
      ],
    },
    version: 0,
  }),
  'budget-rules': JSON.stringify({
    state: {
      rules: [
        {
          id: 'e2e-rule',
          keyword: 'Merchant',
          matcherType: 'Contains',
          categoryId: 'cat-1',
          priority: 1,
          createdAt: '2026-09-09T10:00:00.000Z',
        },
      ],
    },
    version: 0,
  }),
  'budget-budgets': JSON.stringify({
    state: {
      budgets: [
        {
          id: 'e2e-budget',
          workspaceId: 'workspace-e2e',
          name: 'E2E budget',
          color: '#ffffff',
          limitAmount: 1000,
          limitCurrency: 'PLN',
          categoryIds: ['cat-1'],
          createdAt: '2026-09-09T10:00:00.000Z',
          isArchived: false,
          budgetType: 'standard',
          period: { type: 'monthly' },
        },
      ],
    },
    version: 0,
  }),
};

const expectStat = async (
  page: Parameters<typeof setupAuthenticatedUser>[0],
  label: string,
  value: string,
): Promise<void> => {
  const stat = page.getByText(label, { exact: true }).last().locator('..');
  await expect(stat).toContainText(value);
};

test.describe('Encrypted vault — complete local roundtrip', () => {
  test('exports, clears and restores all local collections', async ({
    page,
  }, testInfo) => {
    await page.addInitScript((sources) => {
      if (sessionStorage.getItem('vault-roundtrip-seeded') === 'true') {
        return;
      }
      Object.entries(sources).forEach(([key, value]) =>
        localStorage.setItem(key, value),
      );
      sessionStorage.setItem('vault-roundtrip-seeded', 'true');
    }, LEGACY_SOURCES);

    await setupAuthenticatedUser(page, 'Member', { unlock: false });
    await unlockVault(page);
    await page.getByRole('button', { name: 'Konto domowe' }).click();
    await page.getByRole('menuitem', { name: 'Ustawienia' }).click();

    await expectStat(page, 'Transakcje', '1');
    await expectStat(page, 'Kategorie', '8');
    await expectStat(page, 'Budżety', '1');
    await expectStat(page, 'Reguły', '1');
    await expectStat(page, 'Historia okresów', '0');
    await expectStat(page, 'Historia importów', '0');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Eksportuj dane (JSON)' }).click();
    const download = await downloadPromise;
    const backupPath = testInfo.outputPath('vault-backup.json');
    await download.saveAs(backupPath);

    await page.getByRole('button', { name: 'Wyczyść dane' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel(/Wpisz/).fill('USUŃ');
    await dialog.getByRole('button', { name: 'Wyczyść dane' }).click();

    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByLabel('Hasło sejfu')).toBeVisible();
    await unlockVault(page);
    await page.getByRole('button', { name: 'Konto domowe' }).click();
    await page.getByRole('menuitem', { name: 'Ustawienia' }).click();
    await expectStat(page, 'Transakcje', '0');
    await expectStat(page, 'Kategorie', '8');
    await expectStat(page, 'Budżety', '0');
    await expectStat(page, 'Reguły', '0');
    await expectStat(page, 'Historia okresów', '0');
    await expectStat(page, 'Historia importów', '0');

    await page
      .locator('input[type="file"][aria-label="Wybierz plik JSON do importu"]')
      .setInputFiles(backupPath);
    await expect(page.getByText('Dane zaimportowane pomyślnie.')).toBeVisible();
    await expectStat(page, 'Transakcje', '1');
    await expectStat(page, 'Kategorie', '8');
    await expectStat(page, 'Budżety', '1');
    await expectStat(page, 'Reguły', '1');
    await expectStat(page, 'Historia okresów', '0');
    await expectStat(page, 'Historia importów', '0');
  });
});
