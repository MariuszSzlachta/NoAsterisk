import { describe, expect, it } from 'vitest';

import { stripLeadingHash } from '#features/csv-import/model/column-mapping/normalize-header/strip-leading-hash';

describe('stripLeadingHash', () => {
  it('removes single #', () => {
    expect(stripLeadingHash('#Kwota')).toBe('Kwota');
  });

  it('removes multiple ##', () => {
    expect(stripLeadingHash('##Opis')).toBe('Opis');
  });

  it('removes # with trailing space', () => {
    expect(stripLeadingHash('# Data operacji')).toBe('Data operacji');
  });

  it('returns unchanged when no #', () => {
    expect(stripLeadingHash('Kwota')).toBe('Kwota');
  });
});
