import { describe, expect, it } from 'vitest';

import type { TransactionRow } from '#features/csv-import/model/transformation/types/transaction-row';
import { computeBatchHash } from '#features/csv-import/model/submission/import-chunks/compute-batch-hash';

const makeRow = (overrides: Partial<TransactionRow> = {}): TransactionRow => ({
  id: crypto.randomUUID(),
  date: '2026-06-26',
  title: 'BIEDRONKA',
  amount: -87.43,
  currency: 'PLN',
  status: 'ok',
  ...overrides,
});

describe('computeBatchHash', () => {
  it('produces 64-char hex hash', async () => {
    const hash = await computeBatchHash([makeRow()]);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces different hash for different row sets', async () => {
    const hash1 = await computeBatchHash([makeRow({ amount: -10 })]);
    const hash2 = await computeBatchHash([makeRow({ amount: -20 })]);
    expect(hash1).not.toBe(hash2);
  });
});
