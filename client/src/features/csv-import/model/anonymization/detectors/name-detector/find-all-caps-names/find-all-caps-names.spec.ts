import { describe, expect, it } from 'vitest';

import { findAllCapsNames } from '#features/csv-import/model/anonymization/detectors/name-detector/find-all-caps-names';

describe('findAllCapsNames', () => {
  it('finds two adjacent ALL-CAPS words', () => {
    const results = findAllCapsNames('JAN KOWALSKI opłata');

    expect(results).toHaveLength(1);
    expect(results[0]?.original).toBe('JAN KOWALSKI');
    expect(results[0]?.index).toBe(0);
  });

  it('finds three adjacent ALL-CAPS words', () => {
    const results = findAllCapsNames('JAN MARIA KOWALSKI');

    expect(results.some((r) => r.original === 'JAN MARIA')).toBe(true);
    expect(results.some((r) => r.original === 'JAN MARIA KOWALSKI')).toBe(true);
  });

  it('finds words separated by hyphen', () => {
    const results = findAllCapsNames('NOWAK-WIŚNIEWSKA test');

    expect(results).toHaveLength(1);
    expect(results[0]?.original).toBe('NOWAK-WIŚNIEWSKA');
  });

  it('returns empty for single ALL-CAPS word', () => {
    const results = findAllCapsNames('KOWALSKI test');

    expect(results).toHaveLength(0);
  });

  it('returns empty for non-adjacent ALL-CAPS words', () => {
    const results = findAllCapsNames('JAN opłata KOWALSKI');

    expect(results).toHaveLength(0);
  });

  it('returns empty for empty string', () => {
    const results = findAllCapsNames('');

    expect(results).toHaveLength(0);
  });

  it('handles multiple pairs in one text', () => {
    const results = findAllCapsNames('JAN KOWALSKI przelew ANNA NOWAK');

    const originals = results.map((r) => r.original);
    expect(originals).toContain('JAN KOWALSKI');
    expect(originals).toContain('ANNA NOWAK');
  });
});
