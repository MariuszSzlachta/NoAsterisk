import { describe, expect, it } from 'vitest';

import { transformRows } from './row.transformer';

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

  it('throws when neither amount nor debit/credit mapped', () => {
    const rows = [{ D: '2026-06-26', T: 'TEST' }];
    const mapping = { D: 'date' as const, T: 'title' as const };

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

  describe('debit/credit split handling', () => {
    it('resolves credit (Ma) as positive amount', () => {
      const rows = [
        { D: '2026-06-26', T: 'PRZELEW PRZYCHODZĄCY', Wn: '', Ma: '8 500,00' },
      ];
      const mapping = {
        D: 'date' as const,
        T: 'title' as const,
        Wn: 'debit' as const,
        Ma: 'credit' as const,
      };

      const result = transformRows(rows, mapping);

      expect(result[0].amount).toBe(8500);
      expect(result[0].status).toBe('ok');
    });

    it('resolves debit (Wn) as negative amount', () => {
      const rows = [
        { D: '2026-06-26', T: 'ZAKUP KARTĄ', Wn: '234,87', Ma: '' },
      ];
      const mapping = {
        D: 'date' as const,
        T: 'title' as const,
        Wn: 'debit' as const,
        Ma: 'credit' as const,
      };

      const result = transformRows(rows, mapping);

      expect(result[0].amount).toBe(-234.87);
      expect(result[0].status).toBe('ok');
    });

    it('handles debit with only one column mapped', () => {
      const rows = [{ D: '2026-06-26', T: 'OPŁATA', Wn: '100,00' }];
      const mapping = {
        D: 'date' as const,
        T: 'title' as const,
        Wn: 'debit' as const,
      };

      const result = transformRows(rows, mapping);

      expect(result[0].amount).toBe(-100);
      expect(result[0].status).toBe('ok');
    });

    it('handles rows where debit is "0" and credit has value', () => {
      const rows = [
        { D: '2026-06-26', T: 'WPŁYW', Wn: '0,00', Ma: '1 200,00' },
      ];
      const mapping = {
        D: 'date' as const,
        T: 'title' as const,
        Wn: 'debit' as const,
        Ma: 'credit' as const,
      };

      const result = transformRows(rows, mapping);

      expect(result[0].amount).toBe(1200);
    });

    it('marks row as error when both debit and credit are empty', () => {
      const rows = [{ D: '2026-06-26', T: 'DZIWNA OPERACJA', Wn: '', Ma: '' }];
      const mapping = {
        D: 'date' as const,
        T: 'title' as const,
        Wn: 'debit' as const,
        Ma: 'credit' as const,
      };

      const result = transformRows(rows, mapping);

      expect(result[0].status).toBe('error');
      expect(result[0].statusReason).toContain('Invalid amount');
    });

    it('makes debit always negative even if value has sign', () => {
      const rows = [{ D: '2026-06-26', T: 'PRZELEW', Wn: '-500,00', Ma: '' }];
      const mapping = {
        D: 'date' as const,
        T: 'title' as const,
        Wn: 'debit' as const,
        Ma: 'credit' as const,
      };

      const result = transformRows(rows, mapping);

      expect(result[0].amount).toBe(-500);
    });

    it('makes credit always positive even if value has sign', () => {
      const rows = [{ D: '2026-06-26', T: 'WPŁYW', Wn: '', Ma: '+3 000,00' }];
      const mapping = {
        D: 'date' as const,
        T: 'title' as const,
        Wn: 'debit' as const,
        Ma: 'credit' as const,
      };

      const result = transformRows(rows, mapping);

      expect(result[0].amount).toBe(3000);
    });
  });

  describe('multi-column merge', () => {
    it('merges two title columns with space separator', () => {
      const rows = [
        { D: '2026-06-26', T1: 'PRZELEW', T2: 'WYNAGRODZENIE', K: '8500' },
      ];
      const mapping = {
        D: 'date' as const,
        T1: 'title' as const,
        T2: 'title' as const,
        K: 'amount' as const,
      };

      const result = transformRows(rows, mapping);

      expect(result[0]?.title).toBe('PRZELEW WYNAGRODZENIE');
      expect(result[0]?.status).toBe('ok');
    });

    it('merges three title columns preserving CSV column order', () => {
      const rows = [
        { D: '2026-06-26', A: 'Część 1', B: 'Część 2', C: 'Część 3', K: '100' },
      ];
      const mapping = {
        D: 'date' as const,
        A: 'title' as const,
        B: 'title' as const,
        C: 'title' as const,
        K: 'amount' as const,
      };

      const result = transformRows(rows, mapping);

      expect(result[0]?.title).toBe('Część 1 Część 2 Część 3');
    });

    it('filters blank values during merge', () => {
      const rows = [{ D: '2026-06-26', T1: 'BIEDRONKA', T2: '', K: '-50' }];
      const mapping = {
        D: 'date' as const,
        T1: 'title' as const,
        T2: 'title' as const,
        K: 'amount' as const,
      };

      const result = transformRows(rows, mapping);

      expect(result[0]?.title).toBe('BIEDRONKA');
    });

    it('trims whitespace from each column before merge', () => {
      const rows = [
        { D: '2026-06-26', T1: '  PRZELEW  ', T2: '  NA KONTO  ', K: '100' },
      ];
      const mapping = {
        D: 'date' as const,
        T1: 'title' as const,
        T2: 'title' as const,
        K: 'amount' as const,
      };

      const result = transformRows(rows, mapping);

      expect(result[0]?.title).toBe('PRZELEW NA KONTO');
    });

    it('reports error when all merged title columns are blank', () => {
      const rows = [{ D: '2026-06-26', T1: '', T2: '   ', K: '100' }];
      const mapping = {
        D: 'date' as const,
        T1: 'title' as const,
        T2: 'title' as const,
        K: 'amount' as const,
      };

      const result = transformRows(rows, mapping);

      expect(result[0]?.status).toBe('error');
      expect(result[0]?.statusReason).toContain('Empty title');
    });

    it('works with single column for mergeable field (backward compat)', () => {
      const rows = [{ D: '2026-06-26', T: 'SINGLE TITLE', K: '100' }];
      const mapping = {
        D: 'date' as const,
        T: 'title' as const,
        K: 'amount' as const,
      };

      const result = transformRows(rows, mapping);

      expect(result[0]?.title).toBe('SINGLE TITLE');
    });
  });

  describe('new domain fields', () => {
    it('populates source from mapped column', () => {
      const rows = [
        { D: '2026-06-26', T: 'PRZELEW', K: '100', S: 'Jan Kowalski' },
      ];
      const mapping = {
        D: 'date' as const,
        T: 'title' as const,
        K: 'amount' as const,
        S: 'source' as const,
      };

      const result = transformRows(rows, mapping);

      expect(result[0]?.source).toBe('Jan Kowalski');
    });

    it('populates recipient from mapped column', () => {
      const rows = [
        { D: '2026-06-26', T: 'PRZELEW', K: '-500', R: 'BIEDRONKA SP ZOO' },
      ];
      const mapping = {
        D: 'date' as const,
        T: 'title' as const,
        K: 'amount' as const,
        R: 'recipient' as const,
      };

      const result = transformRows(rows, mapping);

      expect(result[0]?.recipient).toBe('BIEDRONKA SP ZOO');
    });

    it('populates reference from mapped column', () => {
      const rows = [
        { D: '2026-06-26', T: 'PRZELEW', K: '100', REF: 'OP-2026-001234' },
      ];
      const mapping = {
        D: 'date' as const,
        T: 'title' as const,
        K: 'amount' as const,
        REF: 'reference' as const,
      };

      const result = transformRows(rows, mapping);

      expect(result[0]?.reference).toBe('OP-2026-001234');
    });

    it('returns undefined for unmapped optional fields', () => {
      const rows = [{ D: '2026-06-26', T: 'TEST', K: '100' }];
      const mapping = {
        D: 'date' as const,
        T: 'title' as const,
        K: 'amount' as const,
      };

      const result = transformRows(rows, mapping);

      expect(result[0]?.source).toBeUndefined();
      expect(result[0]?.recipient).toBeUndefined();
      expect(result[0]?.reference).toBeUndefined();
    });

    it('returns undefined when source column is empty', () => {
      const rows = [{ D: '2026-06-26', T: 'TEST', K: '100', S: '' }];
      const mapping = {
        D: 'date' as const,
        T: 'title' as const,
        K: 'amount' as const,
        S: 'source' as const,
      };

      const result = transformRows(rows, mapping);

      expect(result[0]?.source).toBeUndefined();
    });

    it('merges multiple source columns', () => {
      const rows = [
        { D: '2026-06-26', T: 'PRZELEW', K: '100', S1: 'Jan', S2: 'Kowalski' },
      ];
      const mapping = {
        D: 'date' as const,
        T: 'title' as const,
        K: 'amount' as const,
        S1: 'source' as const,
        S2: 'source' as const,
      };

      const result = transformRows(rows, mapping);

      expect(result[0]?.source).toBe('Jan Kowalski');
    });

    it('does not merge reference (non-mergeable field)', () => {
      const rows = [
        { D: '2026-06-26', T: 'TEST', K: '100', R1: 'REF-001', R2: 'REF-002' },
      ];
      const mapping = {
        D: 'date' as const,
        T: 'title' as const,
        K: 'amount' as const,
        R1: 'reference' as const,
        R2: 'reference' as const,
      };

      const result = transformRows(rows, mapping);

      // Non-mergeable: only first column is used
      expect(result[0]?.reference).toBe('REF-001');
    });
  });
});
