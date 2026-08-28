import { describe, expect, it } from 'vitest';

import type { TransactionRow } from '#features/csv-import/model/transformation/types';
import { mapRowToPayload } from '#features/csv-import/model/submission/import-chunks/map-row-to-payload';

const makeRow = (overrides: Partial<TransactionRow> = {}): TransactionRow => ({
  id: 'test',
  date: '2026-06-26',
  title: 'BIEDRONKA',
  amount: -87.43,
  currency: 'PLN',
  status: 'ok',
  ...overrides,
});

describe('mapRowToPayload', () => {
  it('maps negative amount to absolute value with expense type', () => {
    const result = mapRowToPayload(makeRow({ amount: -87.43 }), 'hash123');

    expect(result.amount).toBe(87.43);
    expect(result.type).toBe('expense');
  });

  it('maps positive amount with income type', () => {
    const result = mapRowToPayload(makeRow({ amount: 5000 }), 'hash456');

    expect(result.amount).toBe(5000);
    expect(result.type).toBe('income');
  });

  it('maps zero amount as income', () => {
    const result = mapRowToPayload(makeRow({ amount: 0 }), 'hash789');

    expect(result.amount).toBe(0);
    expect(result.type).toBe('income');
  });

  it('sets description from title', () => {
    const result = mapRowToPayload(makeRow({ title: 'SKLEP ABC' }), 'hash');

    expect(result.description).toBe('SKLEP ABC');
  });

  it('includes contentHash from parameter', () => {
    const result = mapRowToPayload(makeRow(), 'abc123def456');

    expect(result.contentHash).toBe('abc123def456');
  });

  it('sets empty categoryIds', () => {
    const result = mapRowToPayload(makeRow(), 'hash');

    expect(result.categoryIds).toEqual([]);
  });

  it('preserves date and currency', () => {
    const result = mapRowToPayload(
      makeRow({ date: '2026-01-15', currency: 'EUR' }),
      'hash',
    );

    expect(result.date).toBe('2026-01-15');
    expect(result.currency).toBe('EUR');
  });
});
