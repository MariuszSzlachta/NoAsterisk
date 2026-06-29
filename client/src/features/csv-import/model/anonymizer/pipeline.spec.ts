import { describe, expect, it } from 'vitest';

import type { DictionarySet } from '../types';
import { anonymizeTitle, processRows } from './pipeline';

const DICTS: DictionarySet = {
  firstNames: new Set([
    'jan',
    'anna',
    'piotr',
    'katarzyna',
    'maria',
    'john',
    'marcin',
  ]),
  surnames: new Set([
    'kowalski',
    'nowak',
    'wiśniewski',
    'wiśniewska',
    'smith',
    'lewandowski',
  ]),
  merchants: new Set([
    'BIEDRONKA',
    'ALLEGRO',
    'SPOTIFY',
    'NETFLIX',
    'IKEA',
    'PGE',
    'ORLEN',
    'BOLT',
    'ŻABKA',
    'ROSSMANN',
    'POCZTA POLSKA',
  ]),
  cities: new Set(['WARSZAWA', 'KRAKÓW', 'POZNAŃ', 'JANKI', 'WROCŁAW']),
  phrases: new Set([
    'przelew wychodzący',
    'przelew przychodzący',
    'płatność kartą',
    'przelew własny',
    'zlecenie stałe',
  ]),
};

describe('anonymizeTitle', () => {
  it('detects and masks IBAN', () => {
    const { masked, spans } = anonymizeTitle(
      'PRZELEW Jan Kowalski PL61 1090 1014 0000 0712 1981 2874 opłata',
      DICTS,
    );

    expect(spans.some((s) => s.type === 'iban')).toBe(true);
    expect(masked).not.toContain('1090 1014');
    expect(masked).toContain('••••');
  });

  it('detects name and masks it', () => {
    const { masked, spans } = anonymizeTitle(
      'PRZELEW WYCHODZĄCY Jan Kowalski za mieszkanie',
      DICTS,
    );

    expect(spans.some((s) => s.type === 'name')).toBe(true);
    expect(masked).not.toContain('Jan Kowalski');
    expect(masked).toContain('J••');
  });

  it('does NOT mask merchants', () => {
    const { masked, spans } = anonymizeTitle(
      'PŁATNOŚĆ KARTĄ BIEDRONKA 1234 WARSZAWA',
      DICTS,
    );

    expect(spans.filter((s) => s.type === 'name')).toHaveLength(0);
    expect(masked).toContain('BIEDRONKA');
  });

  it('marks safe titles as safe', () => {
    const { status } = anonymizeTitle('BIEDRONKA 1234 WARSZAWA', DICTS);
    expect(status).toBe('safe');
  });

  it('marks high-confidence detections as anonymized', () => {
    const { status } = anonymizeTitle(
      'PRZELEW Jan Kowalski PL61 1090 1014 0000 0712 1981 2874',
      DICTS,
    );
    // IBAN=0.99, name=0.95 → all ≥0.9 → 'anonymized'
    expect(status).toBe('anonymized');
  });

  it('detects email', () => {
    const { spans } = anonymizeTitle(
      'PRZELEW jan.kowalski@gmail.com opłata',
      DICTS,
    );
    expect(spans.some((s) => s.type === 'email')).toBe(true);
  });

  it('detects phone', () => {
    const { spans } = anonymizeTitle(
      'PRZELEW +48 601 234 567 za usługę',
      DICTS,
    );
    expect(spans.some((s) => s.type === 'phone')).toBe(true);
  });
});

describe('processRows', () => {
  it('processes multiple rows and returns entries', () => {
    const titles = [
      'BIEDRONKA 1234 WARSZAWA',
      'PRZELEW Jan Kowalski za mieszkanie',
      'SPOTIFY PREMIUM subskrypcja',
    ];

    const entries = processRows(titles, DICTS);

    expect(entries).toHaveLength(3);
    expect(entries[0].status).toBe('safe');
    expect(entries[1].status).not.toBe('safe');
    expect(entries[2].status).toBe('safe');
  });
});
