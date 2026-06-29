import { describe, expect, it } from 'vitest';

import { detectDuplicatesAgainstExisting, detectDuplicatesInBatch, hashTransaction } from './duplicate-detector';
import type { TransactionRow } from './types';

const makeRow = (overrides: Partial<TransactionRow> = {}): TransactionRow => ({
  id: '0',
  date: '2026-06-26',
  title: 'BIEDRONKA',
  amount: -87.43,
  currency: 'PLN',
  status: 'ok',
  ...overrides,
});

describe('hashTransaction', () => {
  it('produces consistent hash from date + amount + title', () => {
    const row = makeRow();
    expect(hashTransaction(row)).toBe('2026-06-26|-87.43|biedronka');
  });

  it('is case-insensitive on title', () => {
    const a = makeRow({ title: 'BIEDRONKA' });
    const b = makeRow({ title: 'biedronka' });
    expect(hashTransaction(a)).toBe(hashTransaction(b));
  });
});

describe('detectDuplicatesInBatch', () => {
  it('marks second occurrence as duplicate', () => {
    const rows = [makeRow({ id: '0' }), makeRow({ id: '1' })];
    const result = detectDuplicatesInBatch(rows);

    expect(result[0].status).toBe('ok');
    expect(result[1].status).toBe('duplicate');
    expect(result[1].statusReason).toBe('Duplikat w pliku');
  });

  it('does not flag unique rows', () => {
    const rows = [
      makeRow({ id: '0', amount: -87.43 }),
      makeRow({ id: '1', amount: -34.20 }),
    ];
    const result = detectDuplicatesInBatch(rows);

    expect(result.every((r) => r.status === 'ok')).toBe(true);
  });
});

describe('detectDuplicatesAgainstExisting', () => {
  it('marks rows matching existing hashes as duplicate', () => {
    const rows = [makeRow()];
    const existing = new Set([hashTransaction(makeRow())]);

    const result = detectDuplicatesAgainstExisting(rows, existing);

    expect(result[0].status).toBe('duplicate');
    expect(result[0].statusReason).toBe('Już zaimportowano');
  });

  it('does not flag rows not in existing set', () => {
    const rows = [makeRow()];
    const existing = new Set<string>();

    const result = detectDuplicatesAgainstExisting(rows, existing);

    expect(result[0].status).toBe('ok');
  });
});
