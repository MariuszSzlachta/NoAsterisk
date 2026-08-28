import { describe, expect, it } from 'vitest';

import { detectBankFromHeaders } from '#features/csv-import/model/column-mapping/bank-profiles/detect-bank-from-headers';

describe('detectBankFromHeaders', () => {
  it('detects mBank from header pattern', () => {
    const headers = [
      'Data operacji',
      'Opis operacji',
      'Kwota',
      'Saldo po operacji',
    ];
    expect(detectBankFromHeaders(headers)).toBe('mBank');
  });

  it('returns undefined for unknown bank', () => {
    expect(detectBankFromHeaders(['ID', 'Timestamp'])).toBeUndefined();
  });
});
