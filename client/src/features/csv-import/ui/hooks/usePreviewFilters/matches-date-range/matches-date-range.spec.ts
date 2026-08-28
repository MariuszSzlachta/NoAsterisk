import { describe, expect, it } from 'vitest';

import type { TransactionRow } from '#features/csv-import/model/types';
import { matchesDateRange } from '#features/csv-import/ui/hooks/usePreviewFilters/matches-date-range';

const buildRow = (date: string): TransactionRow => ({
  id: 'r1',
  date,
  title: 'Test',
  amount: 100,
  currency: 'PLN',
  status: 'ok',
});

describe('matchesDateRange', () => {
  it('returns true when both dateFrom and dateTo are empty', () => {
    expect(matchesDateRange(buildRow('2025-06-15'), '', '')).toBe(true);
  });

  it('returns true when row date is within range', () => {
    expect(matchesDateRange(buildRow('2025-06-15'), '2025-06-01', '2025-06-30')).toBe(true);
  });

  it('returns false when row date is before dateFrom', () => {
    expect(matchesDateRange(buildRow('2025-05-31'), '2025-06-01', '2025-06-30')).toBe(false);
  });

  it('returns false when row date is after dateTo', () => {
    expect(matchesDateRange(buildRow('2025-07-01'), '2025-06-01', '2025-06-30')).toBe(false);
  });

  it('returns true when only dateFrom is set and row is after', () => {
    expect(matchesDateRange(buildRow('2025-06-15'), '2025-06-01', '')).toBe(true);
  });

  it('returns true when only dateTo is set and row is before', () => {
    expect(matchesDateRange(buildRow('2025-06-15'), '', '2025-06-30')).toBe(true);
  });

  it('includes boundary dates (equal to dateFrom)', () => {
    expect(matchesDateRange(buildRow('2025-06-01'), '2025-06-01', '2025-06-30')).toBe(true);
  });

  it('includes boundary dates (equal to dateTo)', () => {
    expect(matchesDateRange(buildRow('2025-06-30'), '2025-06-01', '2025-06-30')).toBe(true);
  });
});
