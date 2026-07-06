import { describe, expect, it } from 'vitest';

import type { DictionarySet } from '../types';
import { emailDetector } from './email.detector';

const EMPTY_DICTS: DictionarySet = {
  firstNames: new Set(),
  surnames: new Set(),
  merchants: new Set(),
  cities: new Set(),
  phrases: new Set(),
};

describe('emailDetector', () => {
  it('detects standard email with high confidence (personal-looking)', () => {
    const text = 'PRZELEW jan.kowalski@gmail.com za usługę';
    const spans = emailDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(1);
    expect(spans[0].original).toBe('jan.kowalski@gmail.com');
    expect(spans[0].confidence).toBe(0.97);
  });

  it('gives lower confidence to short/generic emails', () => {
    const text = 'PRZELEW info@firma.pl za usługę';
    const spans = emailDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(1);
    expect(spans[0].confidence).toBe(0.82);
  });

  it('detects email with subdomain', () => {
    const text = 'Kontakt user@mail.company.co.uk';
    const spans = emailDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(1);
  });

  it('does NOT flag plain domains without @', () => {
    const text = 'SPOTIFY PREMIUM spotify.com subscription';
    const spans = emailDetector.detect(text, EMPTY_DICTS);

    expect(spans).toHaveLength(0);
  });

  it('has correct priority and id', () => {
    expect(emailDetector.id).toBe('email');
    expect(emailDetector.priority).toBe(70);
  });
});
