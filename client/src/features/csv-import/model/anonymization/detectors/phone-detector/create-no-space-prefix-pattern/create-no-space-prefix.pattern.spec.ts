import { describe, expect, it } from 'vitest';

import { createNoSpacePrefixPattern } from '#features/csv-import/model/anonymization/detectors/phone-detector/create-no-space-prefix-pattern';

describe('createNoSpacePrefixPattern', () => {
  it('matches parenthesized prefix with compact digits', () => {
    const pattern = createNoSpacePrefixPattern();
    const matches = Array.from('(+48)601234567'.matchAll(pattern));

    expect(matches).toHaveLength(1);
    expect(matches[0]?.[0]).toBe('(+48)601234567');
  });

  it('matches + prefix with compact digits', () => {
    const pattern = createNoSpacePrefixPattern();
    const matches = Array.from('+48601234567'.matchAll(pattern));

    expect(matches).toHaveLength(1);
    expect(matches[0]?.[0]).toBe('+48601234567');
  });
});
