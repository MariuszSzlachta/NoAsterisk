import { describe, expect, it } from 'vitest';

import { defaultBankProfileRegistry } from '#features/csv-import/model/column-mapping/bank-profiles/default-bank-profile-registry';

describe('defaultBankProfileRegistry', () => {
  it('is created with builtin signatures', () => {
    expect(defaultBankProfileRegistry.getAll().length).toBeGreaterThan(0);
  });

  it('detects known banks', () => {
    const mBankHeaders = [
      'Data operacji',
      'Opis operacji',
      'Kwota',
      'Saldo po operacji',
    ];
    expect(defaultBankProfileRegistry.detect(mBankHeaders)).toBe('mBank');
  });

  it('returns undefined for unknown headers', () => {
    expect(defaultBankProfileRegistry.detect(['unknown'])).toBeUndefined();
  });
});
