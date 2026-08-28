import { describe, expect, it } from 'vitest';

import { hasNameContext } from '#features/csv-import/model/anonymization/detectors/name-detector/has-name-context';

describe('hasNameContext', () => {
  it('returns true when context keyword found before start', () => {
    expect(hasNameContext('Przelew od Jan Kowalski', 13)).toBe(true);
  });

  it('returns false when no context keyword before start', () => {
    expect(hasNameContext('Jakiś tekst Jan Kowalski', 13)).toBe(false);
  });

  it('returns true for "nadawca" keyword', () => {
    expect(hasNameContext('nadawca Jan Kowalski', 8)).toBe(true);
  });

  it('returns false when keyword is too far away', () => {
    const text = 'przelew ' + 'x'.repeat(30) + 'Jan Kowalski';
    expect(hasNameContext(text, 38)).toBe(false);
  });
});
