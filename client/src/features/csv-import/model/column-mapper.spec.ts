import { describe, expect, it } from 'vitest';

import { autoDetectMapping } from './column-mapper';

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
