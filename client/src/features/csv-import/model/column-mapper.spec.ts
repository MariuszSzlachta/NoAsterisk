import { describe, expect, it } from 'vitest';

import { applyMapping, autoDetectMapping } from './column-mapper';

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
});

describe('applyMapping', () => {
  it('maps CSV rows to TransactionRow using column mapping', () => {
    const rows = [
      { 'Data operacji': '2026-06-26', 'Opis': 'BIEDRONKA', 'Kwota': '-87,43', 'Waluta': 'PLN' },
    ];
    const mapping = { 'Data operacji': 'date' as const, 'Opis': 'title' as const, 'Kwota': 'amount' as const, 'Waluta': 'currency' as const };

    const result = applyMapping(rows, mapping);

    expect(result[0].date).toBe('2026-06-26');
    expect(result[0].title).toBe('BIEDRONKA');
    expect(result[0].amount).toBe(-87.43);
    expect(result[0].currency).toBe('PLN');
    expect(result[0].status).toBe('ok');
    expect(result[0].id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('defaults currency to PLN when not mapped', () => {
    const rows = [{ 'Data': '2026-06-26', 'Opis': 'TEST', 'Kwota': '100' }];
    const mapping = { 'Data': 'date' as const, 'Opis': 'title' as const, 'Kwota': 'amount' as const };

    const result = applyMapping(rows, mapping);

    expect(result[0].currency).toBe('PLN');
  });

  it('parses amounts with space thousands separator', () => {
    const rows = [{ 'D': '2026-01-01', 'T': 'SALARY', 'K': '8 500,00' }];
    const mapping = { 'D': 'date' as const, 'T': 'title' as const, 'K': 'amount' as const };

    const result = applyMapping(rows, mapping);

    expect(result[0].amount).toBe(8500);
  });
});
