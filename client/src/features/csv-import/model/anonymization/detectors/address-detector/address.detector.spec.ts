import { describe, expect, it } from 'vitest';

import type { DictionarySet } from '#features/csv-import/model/anonymization/types';

import { addressDetector } from './address.detector';

const EMPTY_DICTS: DictionarySet = {
  firstNames: new Set(),
  surnames: new Set(),
  merchants: new Set(),
  cities: new Set(),
  phrases: new Set(),
};

describe('addressDetector', () => {
  it('detects ul. pattern', () => {
    const text = 'BIEDRONKA 1234 WARSZAWA ul. Marszałkowska 15';
    const spans = addressDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(1);
    expect(spans[0].original).toContain('ul.');
    expect(spans[0].original).toContain('15');
  });

  it('detects al. pattern with apartment number', () => {
    const text = 'Dostawa al. Jerozolimskie 42/5';
    const spans = addressDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(1);
    expect(spans[0].original).toContain('42/5');
  });

  it('detects os. pattern', () => {
    const text = 'Adres os. Stefana Batorego 12';
    const spans = addressDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(1);
  });

  it('does NOT flag text without street prefix', () => {
    const text = 'BIEDRONKA 1234 WARSZAWA zakupy';
    const spans = addressDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(0);
  });

  it('has correct priority', () => {
    expect(addressDetector.priority).toBe(40);
  });
});
