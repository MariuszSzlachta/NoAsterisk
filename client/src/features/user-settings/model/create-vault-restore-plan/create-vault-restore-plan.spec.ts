import { describe, expect, it } from 'vitest';

import { createVaultRestorePlan } from '#features/user-settings/model/create-vault-restore-plan';
import { parseVaultPayload } from '#features/user-settings/model/decrypt-vault-payload';
import {
  createVaultPayload,
  type VaultRecords,
  type VaultRuleRecord,
  type VaultTransactionRecord,
} from '#features/user-settings/model/vault-payload';

const buildTransaction = (
  overrides: Partial<VaultTransactionRecord> = {},
): VaultTransactionRecord => ({
  id: 'tx-1',
  date: '2026-01-01',
  description: 'Groceries',
  amount: -100,
  currency: 'PLN',
  contentHash: 'hash-1',
  batchId: 'batch-1',
  importedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const buildRule = (
  overrides: Partial<VaultRuleRecord> = {},
): VaultRuleRecord => ({
  id: 'rule-1',
  keyword: 'SHOP',
  matcherType: 'Contains',
  categoryId: 'cat-1',
  priority: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const buildRecords = (overrides: Partial<VaultRecords> = {}): VaultRecords => ({
  transactions: [buildTransaction()],
  rules: [buildRule()],
  categories: [],
  budgets: [],
  periodHistory: [],
  importHistory: [],
  ...overrides,
});

describe('createVaultRestorePlan', () => {
  it('returns one complete plan for a valid current payload', () => {
    const payload = createVaultPayload(
      buildRecords(),
      '2026-02-01T00:00:00.000Z',
    );

    const plan = createVaultRestorePlan(payload);

    expect(plan?.payload).toEqual(payload);
  });

  it('preserves empty current collections so restore can clear stale data', () => {
    const payload = createVaultPayload(
      buildRecords({
        transactions: [],
        rules: [],
        categories: [],
        budgets: [],
        periodHistory: [],
        importHistory: [],
      }),
    );

    const plan = createVaultRestorePlan(payload);

    expect(plan?.payload).toMatchObject({
      transactions: [],
      rules: [],
      categories: [],
      budgets: [],
      periodHistory: [],
      importHistory: [],
    });
  });

  it('creates a legacy plan only after current record validation', () => {
    const legacy = parseVaultPayload(
      JSON.stringify({
        transactions: [buildTransaction()],
        rules: [buildRule()],
      }),
    );

    const plan = createVaultRestorePlan(legacy);

    expect(plan?.payload).toEqual({
      schemaVersion: 0,
      transactions: [buildTransaction()],
      rules: [buildRule()],
    });
  });

  it.each(['invalid current section', 'legacy parser warning'])(
    'returns no plan for %s',
    (caseName) => {
      const payload =
        caseName === 'invalid current section'
          ? {
              ...createVaultPayload(buildRecords()),
              budgets: [{ id: 'broken' }],
            }
          : parseVaultPayload(
              JSON.stringify({
                transactions: [buildTransaction(), { id: 'missing-fields' }],
                rules: [buildRule()],
              }),
            );

      expect(createVaultRestorePlan(payload)).toBeUndefined();
    },
  );
});
