import { describe, expect, it } from 'vitest';

import type { TransactionRow } from '#features/csv-import/model/transformation/types/transaction-row';
import { computeContentHash } from '#features/csv-import/model/submission/import-chunks/compute-content-hash';

const makeRow = (overrides: Partial<TransactionRow> = {}): TransactionRow => ({
  id: crypto.randomUUID(),
  date: '2026-06-26',
  title: 'BIEDRONKA',
  amount: -87.43,
  currency: 'PLN',
  status: 'ok',
  ...overrides,
});

describe('computeContentHash', () => {
  it('produces 64-char hex hash', async () => {
    const hash = await computeContentHash(makeRow());
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces same hash for same data', async () => {
    const row = makeRow({ date: '2026-06-26', amount: -87.43, title: 'TEST' });
    const hash1 = await computeContentHash(row);
    const hash2 = await computeContentHash(row);
    expect(hash1).toBe(hash2);
  });

  it('produces different hash for different amounts', async () => {
    const row1 = makeRow({ amount: -87.43 });
    const row2 = makeRow({ amount: -100.0 });
    const hash1 = await computeContentHash(row1);
    const hash2 = await computeContentHash(row2);
    expect(hash1).not.toBe(hash2);
  });

  it('is case-insensitive on title', async () => {
    const row1 = makeRow({ title: 'BIEDRONKA' });
    const row2 = makeRow({ title: 'biedronka' });
    const hash1 = await computeContentHash(row1);
    const hash2 = await computeContentHash(row2);
    expect(hash1).toBe(hash2);
  });
});
