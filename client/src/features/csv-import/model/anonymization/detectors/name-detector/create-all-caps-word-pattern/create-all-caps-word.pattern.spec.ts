import { describe, expect, it } from 'vitest';

import { createAllCapsWordPattern } from '#features/csv-import/model/anonymization/detectors/name-detector/create-all-caps-word-pattern';

describe('createAllCapsWordPattern', () => {
  it('matches ALL-CAPS word with 3+ letters', () => {
    const pattern = createAllCapsWordPattern();
    const matches = Array.from('JAN KOWALSKI test'.matchAll(pattern));

    expect(matches).toHaveLength(2);
    expect(matches[0]?.[0]).toBe('JAN');
    expect(matches[1]?.[0]).toBe('KOWALSKI');
  });

  it('matches words with Polish diacritics inside word', () => {
    const pattern = createAllCapsWordPattern();
    const matches = Array.from('WIŚNIEWSKI test'.matchAll(pattern));

    expect(matches).toHaveLength(1);
    expect(matches[0]?.[0]).toContain('NIEWSKI');
  });

  it('does not match 2-letter words', () => {
    const pattern = createAllCapsWordPattern();
    const matches = Array.from('AB test'.matchAll(pattern));

    expect(matches).toHaveLength(0);
  });

  it('does not match lowercase words', () => {
    const pattern = createAllCapsWordPattern();
    const matches = Array.from('jan kowalski'.matchAll(pattern));

    expect(matches).toHaveLength(0);
  });

  it('returns fresh regex instance each call', () => {
    const a = createAllCapsWordPattern();
    const b = createAllCapsWordPattern();
    expect(a).not.toBe(b);
  });
});
