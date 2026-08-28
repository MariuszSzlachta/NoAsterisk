import { describe, expect, it } from 'vitest';

import type { TransactionRow } from '#features/csv-import/model/types';
import { matchesTypeFilter } from '#features/csv-import/ui/hooks/usePreviewFilters/matches-type-filter';

const buildRow = (amount: number): TransactionRow => ({
  id: 'r1',
  date: '2025-01-15',
  title: 'Test',
  amount,
  currency: 'PLN',
  status: 'ok',
});

describe('matchesTypeFilter', () => {
  it('returns true for all rows when filter is all', () => {
    expect(matchesTypeFilter(buildRow(100), 'all')).toBe(true);
    expect(matchesTypeFilter(buildRow(-50), 'all')).toBe(true);
  });

  it('returns true for positive amounts when filter is income', () => {
    expect(matchesTypeFilter(buildRow(100), 'income')).toBe(true);
  });

  it('returns false for negative amounts when filter is income', () => {
    expect(matchesTypeFilter(buildRow(-50), 'income')).toBe(false);
  });

  it('returns true for negative amounts when filter is expense', () => {
    expect(matchesTypeFilter(buildRow(-50), 'expense')).toBe(true);
  });

  it('returns false for positive amounts when filter is expense', () => {
    expect(matchesTypeFilter(buildRow(100), 'expense')).toBe(false);
  });
});
