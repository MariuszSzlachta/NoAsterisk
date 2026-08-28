import { describe, expect, it } from 'vitest';

import { createPlPhonePattern } from '#features/csv-import/model/anonymization/detectors/phone-detector/create-pl-phone-pattern';

describe('createPlPhonePattern', () => {
  it('matches +48 prefixed phone with spaces', () => {
    const pattern = createPlPhonePattern();
    const matches = Array.from('+48 601 234 567'.matchAll(pattern));

    expect(matches).toHaveLength(1);
    expect(matches[0]?.[0]).toBe('+48 601 234 567');
  });

  it('matches 9-digit phone without prefix', () => {
    const pattern = createPlPhonePattern();
    const matches = Array.from('tel 601234567'.matchAll(pattern));

    expect(matches).toHaveLength(1);
    expect(matches[0]?.[0]).toBe('601234567');
  });

  it('matches phone with dashes', () => {
    const pattern = createPlPhonePattern();
    const matches = Array.from('601-234-567'.matchAll(pattern));

    expect(matches).toHaveLength(1);
    expect(matches[0]?.[0]).toBe('601-234-567');
  });
});
