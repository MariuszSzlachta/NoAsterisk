import { describe, expect, it } from 'vitest';

import { transformRows } from './row-transformer';

describe('transformRows', () => {
  it('transforms valid rows to TransactionRow', () => {
    const rows = [
      { Data: '2026-06-26', Opis: 'BIEDRONKA', Kwota: '-87,43', Waluta: 'PLN' },
    ];
    const mapping = {
      Data: 'date' as const,
      Opis: 'title' as const,
      Kwota: 'amount' as const,
      Waluta: 'currency' as const,
    };

    const result = transformRows(rows, mapping);

    expect(result[0].date).toBe('2026-06-26');
    expect(result[0].title).toBe('BIEDRONKA');
    expect(result[0].amount).toBe(-87.43);
    expect(result[0].status).toBe('ok');
    expect(result[0].id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('marks rows with invalid amount as error', () => {
    const rows = [{ D: '2026-06-26', T: 'TEST', K: 'abc' }];
    const mapping = {
      D: 'date' as const,
      T: 'title' as const,
      K: 'amount' as const,
    };

    const result = transformRows(rows, mapping);

    expect(result[0].status).toBe('error');
    expect(result[0].statusReason).toContain('Invalid amount');
  });

  it('marks rows with empty title as error', () => {
    const rows = [{ D: '2026-06-26', T: '', K: '100' }];
    const mapping = {
      D: 'date' as const,
      T: 'title' as const,
      K: 'amount' as const,
    };

    const result = transformRows(rows, mapping);

    expect(result[0].status).toBe('error');
    expect(result[0].statusReason).toContain('Empty title');
  });

  it('marks rows with unparseable date as warning', () => {
    const rows = [
      { D: '2026-06-26', T: 'OK', K: '100' },
      { D: 'invalid', T: 'BAD DATE', K: '50' },
    ];
    const mapping = {
      D: 'date' as const,
      T: 'title' as const,
      K: 'amount' as const,
    };

    const result = transformRows(rows, mapping);

    expect(result[1].status).toBe('warning');
    expect(result[1].statusReason).toContain('Unparseable date');
  });

  it('throws when required fields not mapped', () => {
    const rows = [{ X: 'data' }];
    const mapping = { X: 'currency' as const };

    expect(() => transformRows(rows, mapping)).toThrow('Required fields');
  });

  it('defaults currency to PLN when not mapped', () => {
    const rows = [{ D: '2026-06-26', T: 'TEST', K: '100' }];
    const mapping = {
      D: 'date' as const,
      T: 'title' as const,
      K: 'amount' as const,
    };

    const result = transformRows(rows, mapping);

    expect(result[0].currency).toBe('PLN');
  });
});
