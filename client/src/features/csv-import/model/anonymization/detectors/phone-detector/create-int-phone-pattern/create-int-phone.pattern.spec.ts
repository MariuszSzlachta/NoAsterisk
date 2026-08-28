import { describe, expect, it } from 'vitest';

import { createIntPhonePattern } from '#features/csv-import/model/anonymization/detectors/phone-detector/create-int-phone-pattern';

describe('createIntPhonePattern', () => {
  it('matches international phone number', () => {
    const pattern = createIntPhonePattern();
    const matches = Array.from('+1 866 579 7172'.matchAll(pattern));

    expect(matches).toHaveLength(1);
    expect(matches[0]?.[0]).toBe('+1 866 579 7172');
  });

  it('matches +48 prefixed number', () => {
    const pattern = createIntPhonePattern();
    const matches = Array.from('+48 601 234 567'.matchAll(pattern));

    expect(matches).toHaveLength(1);
  });
});
