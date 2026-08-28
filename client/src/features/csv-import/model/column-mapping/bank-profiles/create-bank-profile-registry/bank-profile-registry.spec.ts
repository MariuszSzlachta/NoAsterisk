import { describe, expect, it } from 'vitest';

import { createBankProfileRegistry } from '#features/csv-import/model/column-mapping/bank-profiles/create-bank-profile-registry';
import { defaultBankProfileRegistry } from '#features/csv-import/model/column-mapping/bank-profiles/default-bank-profile-registry';
import { detectBankFromHeaders } from '#features/csv-import/model/column-mapping/bank-profiles/detect-bank-from-headers';

describe('defaultBankProfileRegistry', () => {
  describe('detect', () => {
    it('detects mBank from header pattern', () => {
      const headers = [
        '#Data operacji',
        '#Opis operacji',
        '#Rachunek',
        '#Kwota',
        '#Saldo po operacji',
      ];
      expect(defaultBankProfileRegistry.detect(headers)).toBe('mBank');
    });

    it('detects PKO BP from header pattern', () => {
      const headers = [
        'Data operacji',
        'Data waluty',
        'Typ transakcji',
        'Kwota',
        'Waluta',
      ];
      expect(defaultBankProfileRegistry.detect(headers)).toBe('PKO BP');
    });

    it('detects Millennium from debit/credit pattern', () => {
      const headers = ['Data', 'Opis', 'Obciążenia', 'Uznania', 'Saldo'];
      expect(defaultBankProfileRegistry.detect(headers)).toBe('Millennium');
    });

    it('returns undefined for unknown bank', () => {
      const headers = ['ID', 'Timestamp', 'Amount', 'Description'];
      expect(defaultBankProfileRegistry.detect(headers)).toBeUndefined();
    });
  });
});

describe('createBankProfileRegistry', () => {
  describe('register', () => {
    it('returns new registry with custom signature', () => {
      const registry = createBankProfileRegistry();
      const extended = registry.register({
        displayName: 'Custom Bank',
        headerPatterns: [['custom_date', 'custom_amount', 'custom_desc']],
      });

      expect(
        extended.detect(['custom_date', 'custom_amount', 'custom_desc']),
      ).toBe('Custom Bank');
      expect(
        registry.detect(['custom_date', 'custom_amount', 'custom_desc']),
      ).toBeUndefined();
    });
  });
});

describe('detectBankFromHeaders', () => {
  it('delegates to default registry', () => {
    const headers = [
      'Data operacji',
      'Opis operacji',
      'Kwota',
      'Saldo po operacji',
    ];
    expect(detectBankFromHeaders(headers)).toBe('mBank');
  });
});
