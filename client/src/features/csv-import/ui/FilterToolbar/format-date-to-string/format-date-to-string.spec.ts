import { describe, expect, it } from 'vitest';

import { formatDateToString } from '#features/csv-import/ui/FilterToolbar/format-date-to-string';

describe('formatDateToString', () => {
  it('formats date as YYYY-MM-DD', () => {
    expect(formatDateToString(new Date(2025, 0, 15))).toBe('2025-01-15');
  });

  it('pads single-digit month and day', () => {
    expect(formatDateToString(new Date(2025, 2, 5))).toBe('2025-03-05');
  });

  it('handles December correctly', () => {
    expect(formatDateToString(new Date(2025, 11, 31))).toBe('2025-12-31');
  });
});
