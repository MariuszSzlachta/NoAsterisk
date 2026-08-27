import { describe, expect, it } from 'vitest';

import type { DictionarySet } from '#features/csv-import/model/anonymization/types';

import { nipDetector } from './nip.detector';

const EMPTY_DICTS: DictionarySet = {
  firstNames: new Set(),
  surnames: new Set(),
  merchants: new Set(),
  cities: new Set(),
  phrases: new Set(),
};

describe('nipDetector', () => {
  it('detects valid NIP in dashed format', () => {
    const text = 'Firma NIP 123-456-32-18 sp. z o.o.';
    const spans = nipDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(1);
    expect(spans[0].type).toBe('nip');
    expect(spans[0].original).toBe('123-456-32-18');
  });

  it('detects dashed NIP without context keyword', () => {
    const text = 'Faktura 123-456-32-18 opłacona';
    const spans = nipDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(1);
    expect(spans[0].confidence).toBe(0.92);
  });

  it('gives higher confidence to dashed NIP with context', () => {
    const text = 'NIP: 123-456-32-18';
    const spans = nipDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(1);
    expect(spans[0].confidence).toBe(0.98);
  });

  it('does NOT detect dashed NIP with invalid checksum', () => {
    const text = 'NIP: 123-456-32-19';
    const spans = nipDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(0);
  });

  it('detects compact 10-digit NIP only with context keyword', () => {
    const text = 'NIP: 1234563218';
    const spans = nipDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(1);
    expect(spans[0].type).toBe('nip');
    expect(spans[0].confidence).toBe(0.95);
  });

  it('does NOT detect compact 10-digit NIP without context', () => {
    const text = 'Identyfikator 1234563218 w systemie';
    const spans = nipDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(0);
  });

  it('has correct priority and id', () => {
    expect(nipDetector.id).toBe('nip');
    expect(nipDetector.priority).toBe(86);
  });
});
