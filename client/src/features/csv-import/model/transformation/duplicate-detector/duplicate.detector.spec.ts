import { describe, expect, it } from 'vitest';

import type { TransactionRow } from '../types';
import {
  detectDuplicatesAgainstExisting,
  detectDuplicatesInBatch,
  hashTransaction,
} from './duplicate.detector';

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

  it('produces unique hash for NaN amount', () => {
    const a = makeRow({ amount: NaN });
    const b = makeRow({ amount: NaN });
    expect(hashTransaction(a)).not.toBe(hashTransaction(b));
  });
});

describe('detectDuplicatesInBatch', () => {
  it('does not flag first occurrence', () => {
    const rows = [makeRow({ id: '0' })];
    const result = detectDuplicatesInBatch(rows);

    expect(result[0].status).toBe('ok');
    expect(result[0].duplicateHash).toBeDefined();
  });

  it('marks second occurrence as warning (near-duplicate)', () => {
    const rows = [makeRow({ id: '0' }), makeRow({ id: '1' })];
    const result = detectDuplicatesInBatch(rows);

    expect(result[0].status).toBe('ok');
    expect(result[1].status).toBe('warning');
    expect(result[1].statusReason).toContain('Near-duplicate');
  });

  it('marks third+ occurrence as duplicate', () => {
    const rows = [
      makeRow({ id: '0' }),
      makeRow({ id: '1' }),
      makeRow({ id: '2' }),
    ];
    const result = detectDuplicatesInBatch(rows);

    expect(result[0].status).toBe('ok');
    expect(result[1].status).toBe('warning');
    expect(result[2].status).toBe('duplicate');
    expect(result[2].statusReason).toContain('3+ identical');
  });

  it('does not flag unique rows', () => {
    const rows = [
      makeRow({ id: '0', amount: -87.43 }),
      makeRow({ id: '1', amount: -34.2 }),
    ];
    const result = detectDuplicatesInBatch(rows);

    expect(result.every((r) => r.status === 'ok')).toBe(true);
  });

  it('skips error rows', () => {
    const rows = [
      makeRow({ id: '0', status: 'error', statusReason: 'Invalid amount' }),
      makeRow({ id: '1' }),
    ];
    const result = detectDuplicatesInBatch(rows);

    expect(result[0].status).toBe('error');
    expect(result[1].status).toBe('ok');
  });

  it('handles mixed unique and duplicate rows', () => {
    const rows = [
      makeRow({ id: '0', title: 'BIEDRONKA' }),
      makeRow({ id: '1', title: 'LIDL', amount: -45.0 }),
      makeRow({ id: '2', title: 'BIEDRONKA' }),
      makeRow({ id: '3', title: 'LIDL', amount: -45.0 }),
    ];
    const result = detectDuplicatesInBatch(rows);

    expect(result[0].status).toBe('ok');
    expect(result[1].status).toBe('ok');
    expect(result[2].status).toBe('warning');
    expect(result[3].status).toBe('warning');
  });
});

describe('detectDuplicatesAgainstExisting', () => {
  it('marks rows matching existing hashes as duplicate', () => {
    const rows = [makeRow()];
    const existing = new Set([hashTransaction(makeRow())]);

    const result = detectDuplicatesAgainstExisting(rows, existing);

    expect(result[0].status).toBe('duplicate');
    expect(result[0].statusReason).toBe('Already imported');
  });

  it('does not flag rows not in existing set', () => {
    const rows = [makeRow()];
    const existing = new Set<string>();

    const result = detectDuplicatesAgainstExisting(rows, existing);

    expect(result[0].status).toBe('ok');
  });

  it('does not override existing error status', () => {
    const rows = [makeRow({ status: 'error', statusReason: 'Bad data' })];
    const existing = new Set([hashTransaction(makeRow())]);

    const result = detectDuplicatesAgainstExisting(rows, existing);

    expect(result[0].status).toBe('error');
  });

  it('does not override existing duplicate status', () => {
    const rows = [
      makeRow({
        status: 'duplicate',
        statusReason: 'Duplicate in file (3+ identical rows)',
      }),
    ];
    const existing = new Set([hashTransaction(makeRow())]);

    const result = detectDuplicatesAgainstExisting(rows, existing);

    expect(result[0].status).toBe('duplicate');
    expect(result[0].statusReason).toBe(
      'Duplicate in file (3+ identical rows)',
    );
  });

  it('overrides warning status with cross-file duplicate', () => {
    const rows = [
      makeRow({
        status: 'warning',
        statusReason: 'Near-duplicate',
        duplicateHash: hashTransaction(makeRow()),
      }),
    ];
    const existing = new Set([hashTransaction(makeRow())]);

    const result = detectDuplicatesAgainstExisting(rows, existing);

    expect(result[0].status).toBe('duplicate');
    expect(result[0].statusReason).toBe('Already imported');
  });
});
