import { describe, expect, it } from 'vitest';

import { hasPhoneContext } from '#features/csv-import/model/anonymization/detectors/phone-detector/has-phone-context';

describe('hasPhoneContext', () => {
  it('returns true when "tel." precedes the position', () => {
    const text = 'Kontakt tel. 601234567';
    expect(hasPhoneContext(text, 13)).toBe(true);
  });

  it('returns true when "kontakt" precedes the position', () => {
    const text = 'Kontakt 601234567';
    expect(hasPhoneContext(text, 8)).toBe(true);
  });

  it('returns true when "sms" precedes the position', () => {
    const text = 'sms 601234567';
    expect(hasPhoneContext(text, 4)).toBe(true);
  });

  it('returns true when "mob" precedes the position', () => {
    const text = 'mob 601234567';
    expect(hasPhoneContext(text, 4)).toBe(true);
  });

  it('returns false when no context keyword is present', () => {
    const text = 'PRZELEW 601234567';
    expect(hasPhoneContext(text, 9)).toBe(false);
  });
});
