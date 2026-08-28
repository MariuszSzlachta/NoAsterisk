import { describe, expect, it } from 'vitest';

import { formatPeriodLabel } from '#features/budgets/model/format-period-label';

describe('formatPeriodLabel', () => {
  it('formats monthly period as "from–to month"', () => {
    const from = new Date('2026-06-01');
    const to = new Date('2026-06-30');
    expect(formatPeriodLabel(from, to)).toBe('1–30 Jun');
  });

  it('formats cross-month period', () => {
    const from = new Date('2026-06-15');
    const to = new Date('2026-07-14');
    expect(formatPeriodLabel(from, to)).toBe('15–14 Jul');
  });
});
