import { describe, expect, it } from 'vitest';

import type { DictionarySet } from '#features/csv-import/model/anonymization/types';
import { nameDetector } from './name.detector';

const DICTS: DictionarySet = {
  firstNames: new Set(['jan', 'anna', 'piotr', 'maria', 'john', 'katarzyna']),
  surnames: new Set([
    'kowalski',
    'nowak',
    'wiśniewski',
    'wiśniewska',
    'nowak-wiśniewska',
    'smith',
  ]),
  merchants: new Set([
    'BIEDRONKA',
    'ALLEGRO',
    'SPOTIFY',
    'IKEA',
    'POCZTA POLSKA',
    'PGE',
    'ŻABKA',
  ]),
  cities: new Set(['WARSZAWA', 'KRAKÓW', 'POZNAŃ', 'JANKI', 'WROCŁAW']),
  phrases: new Set([
    'przelew wychodzący',
    'przelew przychodzący',
    'płatność kartą',
    'przelew własny',
  ]),
};

describe('nameDetector', () => {
  it('detects name when both first + last are in dictionary (high confidence)', () => {
    const text = 'PRZELEW WYCHODZĄCY Jan Kowalski opłata za mieszkanie';
    const spans = nameDetector.detect(text, DICTS);

    expect(spans).toHaveLength(1);
    expect(spans[0].original).toBe('Jan Kowalski');
    expect(spans[0].confidence).toBe(0.95);
  });

  it('detects name with context keyword even if surname not in dict', () => {
    const text = 'Przelew od Anna Xyz za usługę';
    const spans = nameDetector.detect(text, DICTS);

    expect(spans).toHaveLength(1);
    expect(spans[0].original).toBe('Anna Xyz');
    expect(spans[0].confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('does NOT flag merchant names (BIEDRONKA WARSZAWA)', () => {
    const text = 'PŁATNOŚĆ KARTĄ Biedronka Warszawa';
    const spans = nameDetector.detect(text, DICTS);

    expect(spans).toHaveLength(0);
  });

  it('does NOT flag Ikea Janki (merchant + city)', () => {
    const text = 'PŁATNOŚĆ KARTĄ Ikea Janki zakupy';
    const spans = nameDetector.detect(text, DICTS);

    expect(spans).toHaveLength(0);
  });

  it('does NOT flag Poczta Polska (multi-word merchant)', () => {
    const text = 'PRZELEW Poczta Polska przesyłka';
    const spans = nameDetector.detect(text, DICTS);

    expect(spans).toHaveLength(0);
  });

  it('does NOT flag known phrases (Przelew Wychodzący)', () => {
    const text = 'Przelew Wychodzący na konto';
    const spans = nameDetector.detect(text, DICTS);

    expect(spans).toHaveLength(0);
  });

  it('gives lower confidence without dict match or context', () => {
    const text = 'Jakiś Tekst bez kontekstu';
    const spans = nameDetector.detect(text, DICTS);

    expect(spans).toHaveLength(0);
  });

  it('detects compound surnames', () => {
    const text = 'Przelew od Anna Nowak-Wiśniewska zwrot';
    const spans = nameDetector.detect(text, DICTS);

    expect(spans.length).toBeGreaterThanOrEqual(1);
    const nameSpan = spans.find((s) => s.original.includes('Anna'));
    expect(nameSpan).toBeDefined();
  });

  it('detects English names with context', () => {
    const text = 'Przelew od John Smith payment';
    const spans = nameDetector.detect(text, DICTS);

    expect(spans).toHaveLength(1);
    expect(spans[0].original).toBe('John Smith');
    expect(spans[0].confidence).toBe(0.95);
  });

  it('has correct priority and id', () => {
    expect(nameDetector.id).toBe('name');
    expect(nameDetector.priority).toBe(50);
  });

  it('detects ALL-CAPS names (critical for PL banks)', () => {
    const text = 'PRZELEW WYCHODZĄCY JAN KOWALSKI OPŁATA ZA MIESZKANIE';
    const spans = nameDetector.detect(text, DICTS);

    const nameSpan = spans.find((s) => s.original === 'JAN KOWALSKI');
    expect(nameSpan).toBeDefined();
    expect(nameSpan?.confidence).toBe(0.95);
  });

  it('does NOT flag ALL-CAPS merchants (PGE OBRÓT)', () => {
    const text = 'PŁATNOŚĆ PGE ENERGIA faktura';
    const spans = nameDetector.detect(text, DICTS);

    expect(spans.filter((s) => s.original.includes('PGE'))).toHaveLength(0);
  });

  it('handles surname-first order (KOWALSKI JAN)', () => {
    const text = 'Przelew od Kowalski Jan za usługę';
    const spans = nameDetector.detect(text, DICTS);

    expect(spans).toHaveLength(1);
    expect(spans[0].confidence).toBe(0.95);
  });
});
