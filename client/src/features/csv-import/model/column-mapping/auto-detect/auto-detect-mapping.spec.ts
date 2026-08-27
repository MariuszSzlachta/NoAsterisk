import { describe, expect, it } from 'vitest';

import { autoDetectMapping } from './auto-detect-mapping';

describe('autoDetectMapping', () => {
  it('detects common Polish bank headers', () => {
    const headers = ['Data operacji', 'Opis operacji', 'Kwota', 'Waluta', 'Saldo po operacji'];
    const mapping = autoDetectMapping(headers);

    expect(mapping['Data operacji']).toBe('date');
    expect(mapping['Opis operacji']).toBe('title');
    expect(mapping['Kwota']).toBe('amount');
    expect(mapping['Waluta']).toBe('currency');
    expect(mapping['Saldo po operacji']).toBe('balance');
  });

  it('handles mBank # prefix headers', () => {
    const headers = [
      '#Data operacji', '#Data księgowania', '#Opis operacji', '#Tytuł',
      '#Nadawca/Odbiorca', '#Numer konta', '#Kwota', '#Saldo po operacji',
    ];
    const mapping = autoDetectMapping(headers);

    expect(mapping['#Data operacji']).toBe('date');
    expect(mapping['#Opis operacji']).toBe('title');
    expect(mapping['#Kwota']).toBe('amount');
    expect(mapping['#Saldo po operacji']).toBe('balance');
  });

  it('handles quoted headers (PKO BP style)', () => {
    const headers = ['"Data waluty"', '"Data operacji"', '"Typ"', '"Opis"', '"Kwota"', '"Waluta"'];
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
    const headers = ['DATA WALUTY', 'DATA KSIĘGOWANIA', 'TYP OPERACJI', 'SZCZEGÓŁY', 'KWOTA (PLN)', 'SALDO', 'REF'];
    const mapping = autoDetectMapping(headers);

    expect(mapping['DATA WALUTY']).toBe('date');
    expect(mapping['SZCZEGÓŁY']).toBe('title');
    expect(mapping['KWOTA (PLN)']).toBe('amount');
    expect(mapping['SALDO']).toBe('balance');
  });

  it('handles English Revolut headers', () => {
    const headers = ['Date', 'Description', 'Amount', 'Currency', 'Balance'];
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

  it('does not assign same non-mergeable field to multiple columns', () => {
    const headers = ['Data operacji', 'Data transakcji', 'Kwota'];
    const mapping = autoDetectMapping(headers);

    const dateColumns = Object.entries(mapping).filter(([, f]) => f === 'date');
    expect(dateColumns).toHaveLength(1);
  });

  it('allows mergeable fields to be assigned to multiple columns', () => {
    const headers = ['Opis operacji', 'Tytuł', 'Kwota', 'Data'];
    const mapping = autoDetectMapping(headers);

    const titleColumns = Object.entries(mapping).filter(([, f]) => f === 'title');
    expect(titleColumns.length).toBeGreaterThanOrEqual(2);
  });

  it('allows multiple recipient columns to merge', () => {
    const headers = ['Data', 'Opis', 'Kwota', 'Adresat', 'Nazwa odbiorcy'];
    const mapping = autoDetectMapping(headers);

    const recipientColumns = Object.entries(mapping).filter(([, f]) => f === 'recipient');
    expect(recipientColumns.length).toBe(2);
  });

  it('does not allow non-mergeable fields to be assigned multiple times', () => {
    const headers = ['Kwota', 'Wartość', 'Data'];
    const mapping = autoDetectMapping(headers);

    const amountColumns = Object.entries(mapping).filter(([, f]) => f === 'amount');
    expect(amountColumns.length).toBe(1);
  });

  it('detects recipient from ING format', () => {
    const headers = ['Data operacji', 'Opis', 'Kwota', 'Dane kontrahenta', 'Waluta'];
    const mapping = autoDetectMapping(headers);

    expect(mapping['Dane kontrahenta']).toBe('recipient');
  });

  it('detects reference column', () => {
    const headers = ['Data', 'Opis', 'Kwota', 'Nr referencyjny'];
    const mapping = autoDetectMapping(headers);

    expect(mapping['Nr referencyjny']).toBe('reference');
  });

  it('prefers amount over debit when both match', () => {
    const headers = ['Kwota', 'Kwota Wn', 'Kwota Ma'];
    const mapping = autoDetectMapping(headers);

    expect(mapping['Kwota']).toBe('amount');
    expect(mapping['Kwota Wn']).toBe('debit');
    expect(mapping['Kwota Ma']).toBe('credit');
  });
});
