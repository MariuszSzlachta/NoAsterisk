import { beforeEach, describe, expect, it, vi } from 'vitest';

import { seedBudgets } from './dev-seed-budgets';

const persistenceMocks = vi.hoisted(() => ({
  budgetsReplace: vi.fn(),
  getTransactions: vi.fn(),
  isUnlocked: vi.fn(),
  transactionsReplace: vi.fn(),
}));

vi.mock('#shared/adapters/persistence/session', () => ({
  encryptedPersistence: {
    isUnlocked: persistenceMocks.isUnlocked,
    repository: (collection: string) =>
      collection === 'budgets'
        ? { replace: persistenceMocks.budgetsReplace }
        : {
            getAll: persistenceMocks.getTransactions,
            replace: persistenceMocks.transactionsReplace,
          },
  },
}));

describe('seedBudgets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    persistenceMocks.budgetsReplace.mockResolvedValue(undefined);
    persistenceMocks.transactionsReplace.mockResolvedValue(undefined);
  });

  it('refuses to seed data while the local vault is locked', async () => {
    persistenceMocks.isUnlocked.mockReturnValue(false);

    await expect(seedBudgets()).rejects.toThrow(
      'Unlock the local vault before seeding development data',
    );
    expect(persistenceMocks.getTransactions).not.toHaveBeenCalled();
    expect(persistenceMocks.budgetsReplace).not.toHaveBeenCalled();
  });

  it('replaces budgets and preserves transactions outside the seed namespace', async () => {
    const existingTransaction = {
      id: 'user-transaction',
      date: '2026-09-01',
      description: 'Existing transaction',
      amount: -10,
      currency: 'PLN',
      contentHash: 'existing-hash',
      batchId: 'existing-batch',
      importedAt: '2026-09-01T00:00:00.000Z',
    };
    persistenceMocks.isUnlocked.mockReturnValue(true);
    persistenceMocks.getTransactions.mockResolvedValue([
      existingTransaction,
      { ...existingTransaction, id: 'tx-b-old-seed' },
    ]);
    const consoleSpy = vi
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);

    await seedBudgets();

    expect(persistenceMocks.budgetsReplace).toHaveBeenCalledOnce();
    expect(persistenceMocks.budgetsReplace.mock.calls[0]?.[0]).toHaveLength(5);
    expect(persistenceMocks.transactionsReplace).toHaveBeenCalledOnce();
    const savedTransactions =
      persistenceMocks.transactionsReplace.mock.calls[0]?.[0];
    expect(savedTransactions[0]).toEqual(existingTransaction);
    expect(savedTransactions).not.toContainEqual(
      expect.objectContaining({ id: 'tx-b-old-seed' }),
    );
    expect(savedTransactions).toContainEqual(
      expect.objectContaining({ id: 'tx-b-001', budgetId: 'b-001-groceries' }),
    );
    consoleSpy.mockRestore();
  });
});
