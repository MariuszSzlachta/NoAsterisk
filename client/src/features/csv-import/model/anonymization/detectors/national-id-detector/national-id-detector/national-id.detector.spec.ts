import { describe, expect, it } from 'vitest';

import type { DictionarySet } from '#features/csv-import/model/anonymization/types/dictionary-set';

import { nationalIdDetector } from './national-id.detector';

const EMPTY_DICTS: DictionarySet = {
  firstNames: new Set(),
  surnames: new Set(),
  merchants: new Set(),
  cities: new Set(),
  phrases: new Set(),
};

describe('nationalIdDetector', () => {
  it('detects national ID pattern with context keyword', () => {
    const text = 'nr dowodu ABS 847291 wydany w Krakowie';
    const spans = nationalIdDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(1);
    expect(spans[0].type).toBe('national_id');
    expect(spans[0].original).toBe('ABS 847291');
  });

  it('gives confidence 0.95 with context keyword', () => {
    const text = 'nr dowodu ABS 847291';
    const spans = nationalIdDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(1);
    expect(spans[0].confidence).toBe(0.95);
    expect(spans[0].metadata?.hasContext).toBe(true);
  });

  it('does NOT detect without context when checksum is invalid', () => {
    const text = 'Kod XYZ 123456 referencyjny';
    const spans = nationalIdDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(0);
  });

  it('detects without context when checksum is valid', () => {
    const text = 'Seria ABS 847291 do odbioru';
    const spans = nationalIdDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(1);
    expect(spans[0].confidence).toBe(0.8);
    expect(spans[0].metadata?.hasContext).toBe(false);
  });

  it('detects compact format (no space) with context', () => {
    const text = 'dowód osobisty ABS847291';
    const spans = nationalIdDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(1);
    expect(spans[0].type).toBe('national_id');
  });

  it('has correct priority and id', () => {
    expect(nationalIdDetector.id).toBe('national_id');
    expect(nationalIdDetector.priority).toBe(84);
  });
});
