import { describe, expect, it } from 'vitest';

import type { DictionarySet } from '#features/csv-import/model/anonymization/types';

import { cardDetector } from './card.detector';

const EMPTY_DICTS: DictionarySet = {
  firstNames: new Set(),
  surnames: new Set(),
  merchants: new Set(),
  cities: new Set(),
  phrases: new Set(),
};

describe('cardDetector', () => {
  describe('full card numbers', () => {
    it('detects Visa card with spaces', () => {
      const text = 'Płatność kartą 4532 0151 2345 6789 w sklepie';
      const spans = cardDetector.detect(text, EMPTY_DICTS);

      expect(spans).toHaveLength(1);
      expect(spans[0].original).toBe('4532 0151 2345 6789');
      expect(spans[0].confidence).toBe(0.99);
    });

    it('detects Mastercard with dashes', () => {
      const text = 'Karta 5425-2334-3010-9903 obciążona';
      const spans = cardDetector.detect(text, EMPTY_DICTS);

      expect(spans).toHaveLength(1);
      expect(spans[0].original).toBe('5425-2334-3010-9903');
      expect(spans[0].confidence).toBe(0.99);
    });

    it('rejects numbers that fail Luhn', () => {
      const text = 'Numer 4111 1111 1111 1112 niepoprawny';
      const spans = cardDetector.detect(text, EMPTY_DICTS);

      expect(spans).toHaveLength(0);
    });

    it('detects valid Visa test card (4111 1111 1111 1111)', () => {
      const text = 'Test card 4111 1111 1111 1111 valid';
      const spans = cardDetector.detect(text, EMPTY_DICTS);

      expect(spans).toHaveLength(1);
      expect(spans[0].metadata?.checksumValid).toBe(true);
    });
  });

  describe('compact card numbers', () => {
    it('detects compact 16-digit Visa', () => {
      const text = 'Nr karty 4111111111111111 zatwierdzona';
      const spans = cardDetector.detect(text, EMPTY_DICTS);

      expect(spans).toHaveLength(1);
      expect(spans[0].confidence).toBe(0.97);
    });

    it('rejects 16-digit numbers without card prefix', () => {
      const text = 'ID transakcji 0123456789012345 zakończona';
      const spans = cardDetector.detect(text, EMPTY_DICTS);

      expect(spans).toHaveLength(0);
    });
  });

  describe('masked/partial card numbers', () => {
    it('detects **** **** **** 1234 pattern', () => {
      const text = 'Karta **** **** **** 4820 obciążona';
      const spans = cardDetector.detect(text, EMPTY_DICTS);

      expect(spans).toHaveLength(1);
      expect(spans[0].original).toBe('**** **** **** 4820');
      expect(spans[0].confidence).toBe(0.92);
    });

    it('detects XXXX-XXXX-XXXX-1234 pattern', () => {
      const text = 'Transakcja XXXX-XXXX-XXXX-9903 mBank';
      const spans = cardDetector.detect(text, EMPTY_DICTS);

      expect(spans).toHaveLength(1);
      expect(spans[0].original).toBe('XXXX-XXXX-XXXX-9903');
    });

    it('detects ****1234 short masked', () => {
      const text = 'Płatność ****4820 sklep';
      const spans = cardDetector.detect(text, EMPTY_DICTS);

      expect(spans).toHaveLength(1);
      expect(spans[0].original).toBe('****4820');
    });

    it('detects 6011...4820 dotted pattern', () => {
      const text = 'Nr 6011....4820 karta';
      const spans = cardDetector.detect(text, EMPTY_DICTS);

      expect(spans).toHaveLength(1);
      expect(spans[0].original).toBe('6011....4820');
    });

    it('detects BIN + last4 pattern (601112******4820)', () => {
      const text = 'Karta 601112******4820 aktywna';
      const spans = cardDetector.detect(text, EMPTY_DICTS);

      expect(spans).toHaveLength(1);
      expect(spans[0].original).toBe('601112******4820');
    });
  });

  describe('edge cases', () => {
    it('does NOT flag random 4-digit sequences', () => {
      const text = 'Faktura 1234 opłata za mieszkanie';
      const spans = cardDetector.detect(text, EMPTY_DICTS);

      expect(spans).toHaveLength(0);
    });

    it('does NOT flag phone numbers', () => {
      const text = 'Tel 601 234 567 kontakt';
      const spans = cardDetector.detect(text, EMPTY_DICTS);

      expect(spans).toHaveLength(0);
    });

    it('has correct priority and id', () => {
      expect(cardDetector.id).toBe('card');
      expect(cardDetector.priority).toBe(88);
    });
  });
});
