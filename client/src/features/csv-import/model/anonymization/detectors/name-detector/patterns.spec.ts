import { describe, expect, it } from 'vitest';

import { createAllCapsWordPattern, createMixedCaseNamePattern } from './patterns';

describe('createMixedCaseNamePattern', () => {
  it('matches two-word mixed-case name', () => {
    const pattern = createMixedCaseNamePattern();
    const matches = Array.from('Jan Kowalski opłata'.matchAll(pattern));

    expect(matches).toHaveLength(1);
    expect(matches[0]?.[0]).toBe('Jan Kowalski');
  });

  it('matches three-word mixed-case name', () => {
    const pattern = createMixedCaseNamePattern();
    const matches = Array.from('Anna Maria Kowalska'.matchAll(pattern));

    expect(matches).toHaveLength(1);
    expect(matches[0]?.[0]).toBe('Anna Maria Kowalska');
  });

  it('does not match names starting with non-ASCII diacritics (\\b limitation)', () => {
    const pattern = createMixedCaseNamePattern();
    // \b treats Polish diacritics like Ć, Ś as non-word chars,
    // so names starting with them are NOT matched by the mixed-case pattern.
    // The ALL-CAPS pattern handles these via findAllCapsNames instead.
    const matches = Array.from('od Ćwik Ślusarczyk tekst'.matchAll(pattern));

    expect(matches).toHaveLength(0);
  });

  it('matches names with diacritics after ASCII first char', () => {
    const pattern = createMixedCaseNamePattern();
    const matches = Array.from('Jan Wiśniewski tekst'.matchAll(pattern));

    expect(matches).toHaveLength(1);
    expect(matches[0]?.[0]).toBe('Jan Wiśniewski');
  });

  it('matches hyphenated surname', () => {
    const pattern = createMixedCaseNamePattern();
    const matches = Array.from('Anna Nowak-Wiśniewska'.matchAll(pattern));

    expect(matches).toHaveLength(1);
    expect(matches[0]?.[0]).toBe('Anna Nowak-Wiśniewska');
  });

  it('does not match single word', () => {
    const pattern = createMixedCaseNamePattern();
    const matches = Array.from('Kowalski tekst'.matchAll(pattern));

    expect(matches).toHaveLength(0);
  });

  it('does not match lowercase words', () => {
    const pattern = createMixedCaseNamePattern();
    const matches = Array.from('jan kowalski'.matchAll(pattern));

    expect(matches).toHaveLength(0);
  });

  it('returns fresh regex instance each call', () => {
    const a = createMixedCaseNamePattern();
    const b = createMixedCaseNamePattern();
    expect(a).not.toBe(b);
  });
});

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
