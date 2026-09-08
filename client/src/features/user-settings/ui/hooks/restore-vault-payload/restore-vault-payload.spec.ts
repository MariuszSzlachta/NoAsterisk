import { afterEach, describe, expect, it, vi } from 'vitest';

import { useRulesStore } from '#entities/rule';
import { useTransactionsStore } from '#entities/transaction';
import { useBudgetsStore, usePeriodHistoryStore } from '#entities/budget';
import { useImportHistoryStore } from '#entities/import-batch';
import { createVaultPayload } from '#features/user-settings/model/vault-payload';
import { restoreVaultPayload } from '#features/user-settings/ui/hooks/restore-vault-payload';
import { useCategoriesStore } from '#entities/category';
import { encryptedPersistence } from '#shared/adapters/persistence/session';

const buildPayload = () =>
  createVaultPayload({
    transactions: [],
    rules: [],
    categories: [],
    budgets: [],
    periodHistory: [],
    importHistory: [],
  });

const seedStaleStores = (): void => {
  useTransactionsStore.setState({
    transactions: [
      {
        id: 'stale-tx',
        date: '2026-01-01',
        description: 'Stale',
        amount: -1,
        currency: 'PLN',
        contentHash: 'stale-hash',
        batchId: 'stale-batch',
        importedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  });
  useRulesStore.setState({
    rules: [
      {
        id: 'stale-rule',
        keyword: 'STALE',
        matcherType: 'Contains',
        categoryId: 'stale-category',
        priority: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  });
  useCategoriesStore.setState({
    categories: [{ id: 'stale-category', label: 'Stale', color: '#000000' }],
  });
  useBudgetsStore.setState({
    budgets: [
      {
        id: 'stale-budget',
        workspaceId: 'stale-workspace',
        name: 'Stale',
        color: '#000000',
        limitAmount: 1,
        limitCurrency: 'PLN',
        categoryIds: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        isArchived: false,
        budgetType: 'savings',
        period: null,
      },
    ],
  });
  usePeriodHistoryStore.setState({
    history: [
      {
        id: 'stale-period',
        budgetId: 'stale-budget',
        periodFrom: '2026-01-01',
        periodTo: '2026-01-31',
        limitAmount: 1,
        spentAmount: 1,
        remainingAmount: 0,
        closedAt: '2026-02-01T00:00:00.000Z',
        rollover: null,
      },
    ],
  });
  useImportHistoryStore.getState().setHistory([
    {
      batchId: 'stale-batch',
      fileName: 'stale.csv',
      completedAt: '2026-01-01T00:00:00.000Z',
      acceptedCount: 0,
      duplicateCount: 0,
      rejectedCount: 0,
    },
  ]);
};

describe('restoreVaultPayload', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    useTransactionsStore.setState({ transactions: [] });
    useRulesStore.setState({ rules: [] });
    useCategoriesStore.setState({ categories: [] });
    useBudgetsStore.setState({ budgets: [] });
    usePeriodHistoryStore.setState({ history: [] });
    useImportHistoryStore.getState().setHistory([]);
  });

  it('clears every persisted collection when the complete snapshot is empty', async () => {
    seedStaleStores();
    const replaceCollections = vi
      .spyOn(encryptedPersistence, 'replaceCollections')
      .mockResolvedValue(undefined);

    await restoreVaultPayload(buildPayload());

    expect(replaceCollections).toHaveBeenCalledOnce();
    expect(replaceCollections.mock.calls[0]?.[0]).toEqual([
      { collection: 'transactions', records: [] },
      { collection: 'rules', records: [] },
      { collection: 'categories', records: [] },
      { collection: 'budgets', records: [] },
      { collection: 'period-history', records: [] },
      { collection: 'import-history', records: [] },
    ]);
    expect(useTransactionsStore.getState().transactions).toEqual([]);
    expect(useRulesStore.getState().rules).toEqual([]);
    expect(useCategoriesStore.getState().categories).toEqual([]);
    expect(useBudgetsStore.getState().budgets).toEqual([]);
    expect(usePeriodHistoryStore.getState().history).toEqual([]);
    expect(useImportHistoryStore.getState().history).toEqual([]);
  });

  it('does not write or mutate stores when validation rejects a legacy snapshot', async () => {
    seedStaleStores();
    const replaceCollections = vi
      .spyOn(encryptedPersistence, 'replaceCollections')
      .mockResolvedValue(undefined);

    await expect(
      restoreVaultPayload({
        schemaVersion: 0,
        createdAt: '',
        transactions: [{ id: 'invalid-only' }],
        rules: [],
        categories: [],
        budgets: [],
        periodHistory: [],
        importHistory: [],
      }),
    ).rejects.toThrow('validation');

    expect(replaceCollections).not.toHaveBeenCalled();
    expect(useTransactionsStore.getState().transactions[0]?.id).toBe(
      'stale-tx',
    );
    expect(useBudgetsStore.getState().budgets[0]?.id).toBe('stale-budget');
  });

  it('migrates valid legacy transactions and rules without clearing newer collections', async () => {
    seedStaleStores();
    const replaceCollections = vi
      .spyOn(encryptedPersistence, 'replaceCollections')
      .mockResolvedValue(undefined);

    await restoreVaultPayload({
      schemaVersion: 0,
      createdAt: '',
      transactions: [
        {
          id: 'legacy-tx',
          date: '2026-01-01',
          description: 'Legacy merchant',
          amount: -20,
          currency: 'PLN',
          contentHash: 'legacy-hash',
          batchId: 'legacy-batch',
          importedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      rules: [
        {
          id: 'legacy-rule',
          keyword: 'SHOP',
          matcherType: 'Contains',
          categoryId: 'legacy-category',
          priority: 1,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      categories: [],
      budgets: [],
      periodHistory: [],
      importHistory: [],
    });

    expect(replaceCollections.mock.calls[0]?.[0]).toEqual([
      {
        collection: 'transactions',
        records: expect.any(Array),
      },
      {
        collection: 'rules',
        records: expect.any(Array),
      },
    ]);
    expect(useTransactionsStore.getState().transactions[0]?.id).toBe(
      'legacy-tx',
    );
    expect(useRulesStore.getState().rules[0]?.id).toBe('legacy-rule');
    expect(useCategoriesStore.getState().categories[0]?.id).toBe(
      'stale-category',
    );
    expect(useBudgetsStore.getState().budgets[0]?.id).toBe('stale-budget');
  });
});
