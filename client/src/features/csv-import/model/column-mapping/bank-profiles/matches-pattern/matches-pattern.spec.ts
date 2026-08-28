import { describe, expect, it } from 'vitest';

import { matchesPattern } from '#features/csv-import/model/column-mapping/bank-profiles/matches-pattern';

describe('matchesPattern', () => {
  it('returns true when all pattern elements are found in headers', () => {
    const headers = ['data operacji', 'kwota', 'waluta'];
    const pattern = ['data operacji', 'kwota'];
    expect(matchesPattern(headers, pattern)).toBe(true);
  });

  it('returns false when a pattern element is missing', () => {
    const headers = ['data operacji', 'waluta'];
    const pattern = ['data operacji', 'kwota'];
    expect(matchesPattern(headers, pattern)).toBe(false);
  });

  it('matches partial substrings via includes', () => {
    const headers = ['data operacji bankowej'];
    const pattern = ['data operacji'];
    expect(matchesPattern(headers, pattern)).toBe(true);
  });

  it('returns true for empty pattern', () => {
    const headers = ['data operacji'];
    expect(matchesPattern(headers, [])).toBe(true);
  });

  it('returns false for empty headers with non-empty pattern', () => {
    expect(matchesPattern([], ['kwota'])).toBe(false);
  });
});
