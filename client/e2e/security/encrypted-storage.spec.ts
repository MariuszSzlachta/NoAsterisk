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

const inspectEncryptedRecords = async (page: Parameters<typeof setupAuthenticatedUser>[0]) =>
  page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('budgetflow-encrypted-financial-data');
      request.addEventListener('success', () => resolve(request.result));
      request.addEventListener('error', () => reject(request.error));
    });

    const rows = await new Promise<ReadonlyArray<Record<string, unknown>>>((resolve, reject) => {
      const request = database
        .transaction('records', 'readonly')
        .objectStore('records')
        .getAll();
      request.addEventListener('success', () => {
        const records = request.result;
        resolve(Array.isArray(records) ? records : []);
      });
      request.addEventListener('error', () => reject(request.error));
    });

    database.close();
    return rows.map((row) => ({ keys: Object.keys(row).sort(), serialized: JSON.stringify(row) }));
  });

test.describe('Encrypted local financial storage', () => {
  test('migrates, encrypts, locks on reload and hydrates again', async ({ page }) => {
    await page.addInitScript((sources) => {
      Object.entries(sources).forEach(([key, value]) => localStorage.setItem(key, value));
    }, LEGACY_SOURCES);

    await setupAuthenticatedUser(page, 'Member', { unlock: false });
    await unlockVault(page);

    const storage = await page.evaluate(() => ({
      localStorageKeys: Object.keys(localStorage),
      localStorageValues: Object.values(localStorage),
    }));
    expect(storage.localStorageKeys).not.toContain('budget-transactions');
    expect(storage.localStorageKeys).not.toContain('budget-rules');
    expect(storage.localStorageKeys).not.toContain('budget-budgets');
    expect(storage.localStorageValues.join('\n')).not.toContain('Sensitive Merchant');
    expect(storage.localStorageValues.join('\n')).not.toContain('E2E budget');

    const records = await inspectEncryptedRecords(page);
    expect(records.length).toBeGreaterThanOrEqual(4);
    records.forEach(({ keys, serialized }) => {
      expect(keys).toEqual(['ciphertext', 'collection', 'cryptoVersion', 'id', 'iv', 'updatedAt']);
      expect(serialized).not.toContain('Sensitive Merchant');
      expect(serialized).not.toContain('E2E budget');
      expect(serialized).not.toContain('Merchant');
    });

    await page.reload();
    await expect(page.getByLabel('Hasło sejfu')).toBeVisible();
    await unlockVault(page);
    await page.getByRole('link', { name: 'Transakcje' }).click();
    await page.waitForURL('**/transactions');
    await expect(page.getByText('Sensitive Merchant')).toBeVisible();
  });
});
