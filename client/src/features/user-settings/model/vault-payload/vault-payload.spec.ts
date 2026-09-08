import { describe, expect, it } from 'vitest';

import { parseVaultPayload } from '#features/user-settings/model/decrypt-vault-payload';
import {
  createVaultPayload,
  digestVaultRecords,
  isVaultPayload,
  serializeVaultPayload,
  type VaultBudgetRecord,
  type VaultCategoryRecord,
  type VaultImportHistoryRecord,
  type VaultPeriodHistoryRecord,
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

const buildCategory = (
  overrides: Partial<VaultCategoryRecord> = {},
): VaultCategoryRecord => ({
  id: 'cat-1',
  label: 'Food',
  color: '#00ff00',
  ...overrides,
});

const buildBudget = (
  overrides: Partial<
    Extract<VaultBudgetRecord, { budgetType: 'savings' }>
  > = {},
): VaultBudgetRecord => ({
  id: 'budget-1',
  workspaceId: 'workspace-1',
  name: 'Savings',
  color: '#0000ff',
  limitAmount: 1000,
  limitCurrency: 'PLN',
  categoryIds: ['cat-1'],
  createdAt: '2026-01-01T00:00:00.000Z',
  isArchived: false,
  budgetType: 'savings',
  period: null,
  ...overrides,
});

const buildPeriodHistory = (
  overrides: Partial<VaultPeriodHistoryRecord> = {},
): VaultPeriodHistoryRecord => ({
  id: 'period-1',
  budgetId: 'budget-1',
  periodFrom: '2026-01-01',
  periodTo: '2026-01-31',
  limitAmount: 1000,
  spentAmount: 100,
  remainingAmount: 900,
  closedAt: '2026-02-01T00:00:00.000Z',
  rollover: null,
  ...overrides,
});

const buildImportHistory = (
  overrides: Partial<VaultImportHistoryRecord> = {},
): VaultImportHistoryRecord => ({
  batchId: 'batch-1',
  fileName: 'statement.csv',
  completedAt: '2026-01-01T00:00:00.000Z',
  acceptedCount: 1,
  duplicateCount: 0,
  rejectedCount: 0,
  ...overrides,
});

const buildRecords = (overrides: Partial<VaultRecords> = {}): VaultRecords => ({
  transactions: [buildTransaction()],
  rules: [buildRule()],
  categories: [buildCategory()],
  budgets: [buildBudget()],
  periodHistory: [buildPeriodHistory()],
  importHistory: [buildImportHistory()],
  ...overrides,
});

describe('vault payload', () => {
  it('creates a versioned complete envelope', () => {
    const records = buildRecords();
    const payload = createVaultPayload(records, '2026-02-01T00:00:00.000Z');

    expect(payload).toEqual({
      schemaVersion: 1,
      createdAt: '2026-02-01T00:00:00.000Z',
      ...records,
    });
    expect(isVaultPayload(payload)).toBe(true);
  });

  it('rejects incomplete, duplicate and unsafe canonical payloads', () => {
    const payload = createVaultPayload(
      buildRecords(),
      '2026-02-01T00:00:00.000Z',
    );
    const duplicateTransactionPayload = {
      ...payload,
      transactions: [buildTransaction(), buildTransaction()],
    };
    const unsafeTransactionPayload = {
      ...payload,
      transactions: [{ ...buildTransaction(), rawCsv: 'secret' }],
    };

    expect(isVaultPayload({ ...payload, importHistory: undefined })).toBe(
      false,
    );
    expect(isVaultPayload(duplicateTransactionPayload)).toBe(false);
    expect(isVaultPayload(unsafeTransactionPayload)).toBe(false);
  });

  it('keeps the digest stable when records are reordered', async () => {
    const records = buildRecords({
      transactions: [buildTransaction(), buildTransaction({ id: 'tx-2' })],
      rules: [buildRule(), buildRule({ id: 'rule-2' })],
    });
    const first = await digestVaultRecords(records);
    const second = await digestVaultRecords({
      ...records,
      transactions: [...records.transactions].reverse(),
      rules: [...records.rules].reverse(),
    });

    expect(first).toBe(second);
    expect(
      await digestVaultRecords(
        buildRecords({ categories: [buildCategory({ label: 'Changed' })] }),
      ),
    ).not.toBe(first);
  });

  it('reads legacy payloads and rejects malformed canonical sections', () => {
    const legacy = parseVaultPayload(
      JSON.stringify({
        transactions: [{ id: 'tx-legacy' }],
        rules: [{ id: 'rule-legacy' }],
      }),
    );

    expect(legacy.schemaVersion).toBe(0);
    expect(legacy.transactions).toHaveLength(1);
    expect(legacy.rules).toHaveLength(1);
    expect(() =>
      parseVaultPayload(
        JSON.stringify({
          schemaVersion: 1,
          createdAt: '2026-02-01T00:00:00.000Z',
          transactions: [],
          rules: {},
          categories: [],
          budgets: [],
          periodHistory: [],
          importHistory: [],
        }),
      ),
    ).toThrow('invalid schema');
  });

  it('serializes the canonical schema without raw import data', () => {
    const serialized = serializeVaultPayload(
      createVaultPayload(buildRecords()),
    );

    expect(serialized).toContain('schemaVersion');
    expect(serialized).toContain('importHistory');
    expect(serialized).not.toContain('rawCsv');
    expect(serialized).not.toContain('original');
    expect(serialized).not.toContain('password');
  });
});
