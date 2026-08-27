import { describe, expect, it } from 'vitest';

import type { DictionarySet } from '#features/csv-import/model/anonymization/types';

import { phoneDetector } from './phone.detector';

const EMPTY_DICTS: DictionarySet = {
  firstNames: new Set(),
  surnames: new Set(),
  merchants: new Set(),
  cities: new Set(),
  phrases: new Set(),
};

describe('phoneDetector', () => {
  it('detects PL phone with +48 prefix (high confidence)', () => {
    const text = 'PRZELEW +48 601 234 567 za usługę';
    const spans = phoneDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(1);
    expect(spans[0].original).toBe('+48 601 234 567');
    expect(spans[0].confidence).toBe(0.95);
  });

  it('detects 9-digit PL phone without prefix (medium confidence)', () => {
    const text = 'SPOTIFY 601234567 subscription';
    const spans = phoneDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(1);
    expect(spans[0].confidence).toBe(0.8);
  });

  it('detects international phone', () => {
    const text = 'NETFLIX +1 866 579 7172 NETH';
    const spans = phoneDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(1);
  });

  it('gives higher confidence with context keyword', () => {
    const text = 'Kontakt tel. 601 234 567';
    const spans = phoneDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(1);
    expect(spans[0].confidence).toBe(0.9);
  });

  it('does NOT flag invoice numbers', () => {
    const text = 'FV/2026/123456789 za usługę';
    const spans = phoneDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(0);
  });

  it('does NOT flag numbers after order/id prefix', () => {
    const text = 'Zamówienie nr 601234567';
    const spans = phoneDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(0);
  });

  it('does NOT flag BLIK reference numbers', () => {
    const text = 'OPERACJA BLIK REF: BLK25060700847291';
    const spans = phoneDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(0);
  });

  it('does NOT flag insurance policy numbers', () => {
    const text = 'PZU nr polisy: PKR/2025/KA-BRZOZ/601234567';
    const spans = phoneDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(0);
  });

  it('does NOT flag NR POLISY patterns', () => {
    const text = 'Nr polisy klienta: 501987654';
    const spans = phoneDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(0);
  });

  it('does NOT flag bank REF/ reference codes', () => {
    const text = 'Przelew REF/501234567 uznanie';
    const spans = phoneDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(0);
  });

  it('does NOT flag authorization codes', () => {
    const text = 'Karta 4532****7891 autoryzacja: 847291654';
    const spans = phoneDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(0);
  });

  it('still detects phone after BLIK keyword (real phone in title)', () => {
    const text = 'BLIK Numer tel.: +48 601 234 567';
    const spans = phoneDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(1);
    expect(spans[0].original).toBe('+48 601 234 567');
  });

  it('has correct priority and id', () => {
    expect(phoneDetector.id).toBe('phone');
    expect(phoneDetector.priority).toBe(85);
  });
});
