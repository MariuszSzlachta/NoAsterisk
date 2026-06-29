import { describe, expect, it } from 'vitest';

import type { DictionarySet } from '../../types';
import { ibanDetector } from './iban-detector';

const EMPTY_DICTS: DictionarySet = {
  firstNames: new Set(),
  surnames: new Set(),
  merchants: new Set(),
  cities: new Set(),
  phrases: new Set(),
};

describe('ibanDetector', () => {
  it('detects valid PL IBAN with spaces', () => {
    // Valid PL IBAN (mod97 passes for PL61 1090 1014 0000 0712 1981 2874)
    const text = 'PRZELEW Jan Kowalski PL61 1090 1014 0000 0712 1981 2874';
    const spans = ibanDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(1);
    expect(spans[0].type).toBe('iban');
    expect(spans[0].confidence).toBe(0.99);
    expect(spans[0].original).toContain('PL61');
  });

  it('detects compact IBAN (no spaces)', () => {
    const text = 'Na konto PL61109010140000071219812874';
    const spans = ibanDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(1);
    expect(spans[0].type).toBe('iban');
  });

  it('does NOT detect invalid IBAN (bad checksum)', () => {
    // Changed last digit to make checksum fail
    const text = 'PRZELEW PL61 1090 1014 0000 0712 1981 2875';
    const spans = ibanDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(0);
  });

  it('does NOT flag random 26-digit numbers without country code', () => {
    const text = 'Numer zamówienia 12345678901234567890123456';
    const spans = ibanDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(0);
  });

  it('has correct priority', () => {
    expect(ibanDetector.priority).toBe(90);
    expect(ibanDetector.id).toBe('iban');
  });
});
