import { describe, expect, it } from 'vitest';

import { autoDetectMapping, normalizeHeader } from './column-mapper';

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

describe('autoDetectMapping', () => {
  it('detects common Polish bank headers', () => {
    const headers = [
      'Data operacji',
      'Opis operacji',
      'Kwota',
      'Waluta',
      'Saldo po operacji',
    ];
    const mapping = autoDetectMapping(headers);

    expect(mapping['Data operacji']).toBe('date');
    expect(mapping['Opis operacji']).toBe('title');
    expect(mapping['Kwota']).toBe('amount');
    expect(mapping['Waluta']).toBe('currency');
    expect(mapping['Saldo po operacji']).toBe('balance');
  });

  it('handles mBank # prefix headers', () => {
    const headers = [
      '#Data operacji',
      '#Data księgowania',
      '#Opis operacji',
      '#Tytuł',
      '#Nadawca/Odbiorca',
      '#Numer konta',
      '#Kwota',
      '#Saldo po operacji',
    ];
    const mapping = autoDetectMapping(headers);

    expect(mapping['#Data operacji']).toBe('date');
    expect(mapping['#Opis operacji']).toBe('title');
    expect(mapping['#Kwota']).toBe('amount');
    expect(mapping['#Saldo po operacji']).toBe('balance');
  });

  it('handles quoted headers (PKO BP style)', () => {
    const headers = [
      '"Data waluty"',
      '"Data operacji"',
      '"Typ"',
      '"Opis"',
      '"Kwota"',
      '"Waluta"',
    ];
    const mapping = autoDetectMapping(headers);

    expect(mapping['"Data waluty"']).toBe('date');
    expect(mapping['"Opis"']).toBe('title');
    expect(mapping['"Kwota"']).toBe('amount');
    expect(mapping['"Waluta"']).toBe('currency');
  });

  it('handles headers with parenthetical currency suffix', () => {
    const headers = ['Data', 'Opis', 'Kwota (PLN)', 'Saldo (PLN)'];
    const mapping = autoDetectMapping(headers);

    expect(mapping['Data']).toBe('date');
    expect(mapping['Opis']).toBe('title');
    expect(mapping['Kwota (PLN)']).toBe('amount');
    expect(mapping['Saldo (PLN)']).toBe('balance');
  });

  it('detects debit/credit split columns', () => {
    const headers = ['Data operacji', 'Opis', 'Kwota Wn', 'Kwota Ma', 'Waluta'];
    const mapping = autoDetectMapping(headers);

    expect(mapping['Data operacji']).toBe('date');
    expect(mapping['Opis']).toBe('title');
    expect(mapping['Kwota Wn']).toBe('debit');
    expect(mapping['Kwota Ma']).toBe('credit');
    expect(mapping['Waluta']).toBe('currency');
  });

  it('handles Santander pipe-separated headers', () => {
    const headers = [
      'DATA WALUTY',
      'DATA KSIĘGOWANIA',
      'TYP OPERACJI',
      'SZCZEGÓŁY',
      'KWOTA (PLN)',
      'SALDO',
      'REF',
    ];
    const mapping = autoDetectMapping(headers);

    expect(mapping['DATA WALUTY']).toBe('date');
    expect(mapping['SZCZEGÓŁY']).toBe('title');
    expect(mapping['KWOTA (PLN)']).toBe('amount');
    expect(mapping['SALDO']).toBe('balance');
  });

  it('handles English Revolut headers', () => {
    const headers = [
      'Date',
      'Description',
      'Amount',
      'Currency',
      'Balance',
    ];
    const mapping = autoDetectMapping(headers);

    expect(mapping['Date']).toBe('date');
    expect(mapping['Amount']).toBe('amount');
    expect(mapping['Currency']).toBe('currency');
    expect(mapping['Balance']).toBe('balance');
  });

  it('handles unknown headers gracefully', () => {
    const headers = ['Kolumna A', 'Kwota', 'Kolumna C'];
    const mapping = autoDetectMapping(headers);

    expect(mapping['Kwota']).toBe('amount');
    expect(mapping['Kolumna A']).toBeUndefined();
  });

  it('does not assign same field to multiple columns', () => {
    const headers = ['Data operacji', 'Data transakcji', 'Kwota'];
    const mapping = autoDetectMapping(headers);

    const dateColumns = Object.entries(mapping).filter(([, f]) => f === 'date');
    expect(dateColumns).toHaveLength(1);
  });

  it('prefers amount over debit when both match', () => {
    const headers = ['Kwota', 'Kwota Wn', 'Kwota Ma'];
    const mapping = autoDetectMapping(headers);

    // 'Kwota' matches 'amount' first, so debit/credit still get assigned
    expect(mapping['Kwota']).toBe('amount');
    expect(mapping['Kwota Wn']).toBe('debit');
    expect(mapping['Kwota Ma']).toBe('credit');
  });
});
