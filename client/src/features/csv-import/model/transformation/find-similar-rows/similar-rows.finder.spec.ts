import { describe, expect, it } from 'vitest';

import type { TransactionRow } from '../types';
import { findSimilarRows } from './similar-rows.finder';

const makeRow = (overrides: Partial<TransactionRow> = {}): TransactionRow => ({
  id: crypto.randomUUID(),
  date: '2026-06-26',
  title: 'BIEDRONKA',
  amount: -87.43,
  currency: 'PLN',
  status: 'ok',
  ...overrides,
});

describe('findSimilarRows', () => {
  it('finds rows with same title (case-insensitive)', () => {
    const editedRow = makeRow({ id: 'edited', title: 'BIEDRONKA' });
    const rows = [
      editedRow,
      makeRow({ id: 'match-1', title: 'BIEDRONKA' }),
      makeRow({ id: 'match-2', title: 'biedronka' }),
      makeRow({ id: 'no-match', title: 'LIDL' }),
    ];

    const result = findSimilarRows(rows, 'edited', 'BIEDRONKA');

    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(['match-1', 'match-2']);
  });

  it('excludes the edited row itself', () => {
    const rows = [
      makeRow({ id: 'edited', title: 'BIEDRONKA' }),
      makeRow({ id: 'other', title: 'BIEDRONKA' }),
    ];

    const result = findSimilarRows(rows, 'edited', 'BIEDRONKA');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('other');
  });

  it('excludes error rows', () => {
    const rows = [
      makeRow({ id: 'edited', title: 'BIEDRONKA' }),
      makeRow({ id: 'error-row', title: 'BIEDRONKA', status: 'error' }),
      makeRow({ id: 'ok-row', title: 'BIEDRONKA', status: 'ok' }),
    ];

    const result = findSimilarRows(rows, 'edited', 'BIEDRONKA');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ok-row');
  });

  it('trims whitespace in comparison', () => {
    const rows = [
      makeRow({ id: 'edited', title: '  BIEDRONKA  ' }),
      makeRow({ id: 'match', title: 'BIEDRONKA' }),
    ];

    const result = findSimilarRows(rows, 'edited', '  BIEDRONKA  ');

    expect(result).toHaveLength(1);
  });

  it('returns empty array when title is empty', () => {
    const rows = [
      makeRow({ id: 'edited', title: '' }),
      makeRow({ id: 'other', title: '' }),
    ];

    const result = findSimilarRows(rows, 'edited', '');

    expect(result).toHaveLength(0);
  });

  it('returns empty array when no matches', () => {
    const rows = [
      makeRow({ id: 'edited', title: 'BIEDRONKA' }),
      makeRow({ id: 'other', title: 'LIDL' }),
    ];

    const result = findSimilarRows(rows, 'edited', 'BIEDRONKA');

    expect(result).toHaveLength(0);
  });

  it('includes duplicate and warning status rows', () => {
    const rows = [
      makeRow({ id: 'edited', title: 'BIEDRONKA' }),
      makeRow({ id: 'dup', title: 'BIEDRONKA', status: 'duplicate' }),
      makeRow({ id: 'warn', title: 'BIEDRONKA', status: 'warning' }),
    ];

    const result = findSimilarRows(rows, 'edited', 'BIEDRONKA');

    expect(result).toHaveLength(2);
  });
});
