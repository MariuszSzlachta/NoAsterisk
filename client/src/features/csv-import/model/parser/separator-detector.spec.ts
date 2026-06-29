import { describe, expect, it } from 'vitest';

import { detectSeparator } from './separator-detector';

describe('detectSeparator', () => {
  it('detects semicolons (most PL banks)', () => {
    const text = 'Data;Opis;Kwota;Waluta\n2026-01-01;BIEDRONKA;-87,43;PLN\n2026-01-02;BOLT;-34,20;PLN\n';
    expect(detectSeparator(text)).toBe(';');
  });

  it('detects commas', () => {
    const text = 'Date,Description,Amount\n2026-01-01,UBER,-12.50\n2026-01-02,NETFLIX,-9.99\n';
    expect(detectSeparator(text)).toBe(',');
  });

  it('detects tabs', () => {
    const text = 'Data\tOpis\tKwota\n2026-01-01\tBIEDRONKA\t-87,43\n';
    expect(detectSeparator(text)).toBe('\t');
  });

  it('ignores separators inside quoted fields', () => {
    const text = 'A;B;C\n"hello;world";foo;bar\nx;y;z\n';
    expect(detectSeparator(text)).toBe(';');
  });

  it('handles commas in Polish amounts with semicolons as separator', () => {
    // Key case: amounts have commas (1 234,56) but separator is ;
    const text = 'Data;Opis;Kwota\n2026-01-01;BIEDRONKA;-1 234,56\n2026-01-02;LOTOS;-87,43\n';
    expect(detectSeparator(text)).toBe(';');
  });

  it('defaults to semicolon for empty text', () => {
    expect(detectSeparator('')).toBe(';');
  });
});
