import { describe, expect, it } from 'vitest';

import type { DictionarySet } from '../types';
import { peselDetector } from './pesel.detector';

const EMPTY_DICTS: DictionarySet = {
  firstNames: new Set(),
  surnames: new Set(),
  merchants: new Set(),
  cities: new Set(),
  phrases: new Set(),
};

describe('peselDetector', () => {
  it('detects valid PESEL with correct checksum', () => {
    const text = 'PESEL: 44051401458';
    const spans = peselDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(1);
    expect(spans[0].type).toBe('pesel');
    expect(spans[0].original).toBe('44051401458');
  });

  it('does NOT detect PESEL with invalid checksum', () => {
    // Changed last digit to break checksum
    const text = 'Nr: 44051401450';
    const spans = peselDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(0);
  });

  it('gives confidence 0.99 with context keyword', () => {
    const text = 'PESEL: 44051401458';
    const spans = peselDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(1);
    expect(spans[0].confidence).toBe(0.99);
    expect(spans[0].metadata?.hasContext).toBe(true);
  });

  it('gives confidence 0.88 without context keyword', () => {
    const text = 'Identyfikator 44051401458 w systemie';
    const spans = peselDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(1);
    expect(spans[0].confidence).toBe(0.88);
    expect(spans[0].metadata?.hasContext).toBe(false);
  });

  it('does NOT detect 11-digit number with invalid birth date', () => {
    // Month byte = 99 → invalid birth date encoding
    const text = 'Nr 12995678903';
    const spans = peselDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(0);
  });

  it('does NOT match when embedded in longer number', () => {
    const text = 'Ref 12345678901234';
    const spans = peselDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(0);
  });

  it('has correct priority and id', () => {
    expect(peselDetector.id).toBe('pesel');
    expect(peselDetector.priority).toBe(92);
  });
});
