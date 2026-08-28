import { describe, expect, it } from 'vitest';

import { isLikelyNotPhone } from '#features/csv-import/model/anonymization/detectors/phone-detector/is-likely-not-phone';

describe('isLikelyNotPhone', () => {
  it('returns true for invoice prefix FV/', () => {
    const text = 'FV/123456789';
    expect(isLikelyNotPhone(text, 3)).toBe(true);
  });

  it('returns true for "nr " prefix', () => {
    const text = 'Zamówienie nr 601234567';
    expect(isLikelyNotPhone(text, 14)).toBe(true);
  });

  it('returns true for BLIK reference (BLK prefix)', () => {
    const text = 'OPERACJA BLIK REF: BLK25060700847291';
    // 'BLK' followed by digits — letter before number
    expect(isLikelyNotPhone(text, 22)).toBe(true);
  });

  it('returns true for polisy prefix', () => {
    const text = 'Nr polisy klienta: 501987654';
    expect(isLikelyNotPhone(text, 19)).toBe(true);
  });

  it('returns true for auth code prefix', () => {
    const text = 'autoryzacja: 847291654';
    expect(isLikelyNotPhone(text, 13)).toBe(true);
  });

  it('returns true when letter immediately precedes the number', () => {
    const text = 'REF/501234567';
    expect(isLikelyNotPhone(text, 4)).toBe(true);
  });

  it('returns false for phone with context', () => {
    const text = 'tel. 601 234 567';
    expect(isLikelyNotPhone(text, 5)).toBe(false);
  });

  it('returns false for standalone number', () => {
    const text = 'PRZELEW 601234567 za usługę';
    expect(isLikelyNotPhone(text, 9)).toBe(false);
  });
});
