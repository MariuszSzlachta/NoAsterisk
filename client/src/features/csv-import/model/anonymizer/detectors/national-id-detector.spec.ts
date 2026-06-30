import { describe, expect, it } from 'vitest';

import type { DictionarySet } from '../../types';
import { nationalIdDetector } from './national-id-detector';

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
    // XYZ 123456: X=33,Y=34,Z=35, digits 1,2,3,4,5,6
    // sum (skip idx 3) = 33*7 + 34*3 + 35*1 + 2*7 + 3*3 + 4*1 + 5*7 + 6*3 = 448 → 448%10=8 ≠ 1
    const text = 'Kod XYZ 123456 referencyjny';
    const spans = nationalIdDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(0);
  });

  it('detects without context when checksum is valid', () => {
    // ABS 847291: A=10,B=11,S=28, digits 8,4,7,2,9,1
    // sum (skip idx 3) = 10*7 + 11*3 + 28*1 + 4*7 + 7*3 + 2*1 + 9*7 + 1*3 = 248 → 248%10=8
    // check digit at pos 3 = digits[0] = 8 → valid!
    const text = 'Seria ABS 847291 do odbioru';
    const spans = nationalIdDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(1);
    expect(spans[0].confidence).toBe(0.80);
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
