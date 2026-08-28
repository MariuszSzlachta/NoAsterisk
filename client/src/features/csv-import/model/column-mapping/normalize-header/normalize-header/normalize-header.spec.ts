import { describe, expect, it } from 'vitest';

import { normalizeHeader } from '#features/csv-import/model/column-mapping/normalize-header/normalize-header';

describe('normalizeHeader', () => {
  it('strips leading # characters', () => {
    expect(normalizeHeader('#Data operacji')).toBe('data operacji');
    expect(normalizeHeader('#Kwota')).toBe('kwota');
    expect(normalizeHeader('##Opis')).toBe('opis');
  });

  it('strips # with trailing space', () => {
    expect(normalizeHeader('# Data operacji')).toBe('data operacji');
  });

  it('strips surrounding double quotes', () => {
    expect(normalizeHeader('"Kwota"')).toBe('kwota');
    expect(normalizeHeader('"Data waluty"')).toBe('data waluty');
  });

  it('strips surrounding single quotes', () => {
    expect(normalizeHeader("'Saldo'")).toBe('saldo');
  });

  it('strips parenthetical suffixes', () => {
    expect(normalizeHeader('Kwota (PLN)')).toBe('kwota');
    expect(normalizeHeader('Saldo (zł)')).toBe('saldo');
    expect(normalizeHeader('Amount (EUR)')).toBe('amount');
  });

  it('strips BOM character', () => {
    expect(normalizeHeader('\uFEFFData')).toBe('data');
  });

  it('normalizes multiple spaces to single', () => {
    expect(normalizeHeader('Data   operacji')).toBe('data operacji');
    expect(normalizeHeader('Saldo  po  operacji')).toBe('saldo po operacji');
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalizeHeader('  Kwota  ')).toBe('kwota');
    expect(normalizeHeader('\tData\t')).toBe('data');
  });

  it('lowercases the result', () => {
    expect(normalizeHeader('DATA OPERACJI')).toBe('data operacji');
    expect(normalizeHeader('Kwota Wn')).toBe('kwota wn');
  });

  it('handles combined normalization (# + quotes + parentheses)', () => {
    expect(normalizeHeader('#"Kwota (PLN)"')).toBe('kwota');
  });

  it('handles already-clean headers', () => {
    expect(normalizeHeader('kwota')).toBe('kwota');
    expect(normalizeHeader('data operacji')).toBe('data operacji');
  });

  it('returns empty string for empty input', () => {
    expect(normalizeHeader('')).toBe('');
    expect(normalizeHeader('   ')).toBe('');
  });
});
