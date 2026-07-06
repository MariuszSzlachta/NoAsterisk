import { describe, expect, it } from 'vitest';

import { detectAmountLocale, parseAmount } from './amount.parser';

describe('detectAmountLocale', () => {
  it('detects PL locale (comma decimal)', () => {
    const samples = ['-87,43', '1 234,56', '-34,20', '8 500,00'];
    expect(detectAmountLocale(samples)).toBe('pl');
  });

  it('detects EN locale (dot decimal)', () => {
    const samples = ['-87.43', '1,234.56', '-34.20', '8,500.00'];
    expect(detectAmountLocale(samples)).toBe('en');
  });

  it('detects PL for integers with space thousands', () => {
    const samples = ['1 234', '8 500', '-250'];
    expect(detectAmountLocale(samples)).toBe('pl');
  });

  it('defaults to PL for plain integers', () => {
    const samples = ['-87', '100', '-34'];
    expect(detectAmountLocale(samples)).toBe('pl');
  });
});

describe('parseAmount', () => {
  it('parses PL amount with comma decimal', () => {
    expect(parseAmount('-87,43', 'pl')).toBe(-87.43);
  });

  it('parses PL amount with space thousands', () => {
    expect(parseAmount('8 500,00', 'pl')).toBe(8500);
  });

  it('parses PL amount with dot thousands and comma decimal', () => {
    expect(parseAmount('1.234,56', 'pl')).toBe(1234.56);
  });

  it('parses EN amount with dot decimal', () => {
    expect(parseAmount('-87.43', 'en')).toBe(-87.43);
  });

  it('parses EN amount with comma thousands', () => {
    expect(parseAmount('8,500.00', 'en')).toBe(8500);
  });

  it('handles negative amounts', () => {
    expect(parseAmount('-1 234,56', 'pl')).toBe(-1234.56);
    expect(parseAmount('-1,234.56', 'en')).toBe(-1234.56);
  });

  it('returns null for invalid input', () => {
    expect(parseAmount('abc', 'pl')).toBeNull();
    expect(parseAmount('', 'en')).toBeNull();
  });
});
