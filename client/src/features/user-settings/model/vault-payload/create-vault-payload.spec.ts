import { describe, expect, it } from 'vitest';

import {
  createVaultPayload,
  type VaultRecords,
} from '#features/user-settings/model/vault-payload';

const buildRecords = (): VaultRecords => ({
  transactions: [
    {
      id: 'tx-2',
      date: '2026-01-01',
      description: 'Second',
      amount: -2,
      currency: 'PLN',
      contentHash: 'hash-2',
      batchId: 'batch-2',
      importedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'tx-1',
      date: '2026-01-01',
      description: 'First',
      amount: -1,
      currency: 'PLN',
      contentHash: 'hash-1',
      batchId: 'batch-1',
      importedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  rules: [],
  categories: [],
  budgets: [],
  periodHistory: [],
  importHistory: [],
});

describe('createVaultPayload', () => {
  it('creates the versioned envelope and sorts records deterministically', () => {
    const payload = createVaultPayload(buildRecords(), '2026-02-01T00:00:00.000Z');

    expect(payload.schemaVersion).toBe(1);
    expect(payload.createdAt).toBe('2026-02-01T00:00:00.000Z');
    expect(payload.transactions.map((transaction) => transaction.id)).toEqual([
      'tx-1',
      'tx-2',
    ]);
  });
});
