import { describe, expect, it } from 'vitest';

import { BankProfileRegistry, defaultBankProfileRegistry, detectBankFromHeaders } from './bank-profile.registry';

describe('BankProfileRegistry', () => {
  describe('detect', () => {
    it('detects mBank from header pattern', () => {
      const headers = ['#Data operacji', '#Opis operacji', '#Rachunek', '#Kwota', '#Saldo po operacji'];
      expect(defaultBankProfileRegistry.detect(headers)).toBe('mBank');
    });

    it('detects PKO BP from header pattern', () => {
      const headers = ['Data operacji', 'Data waluty', 'Typ transakcji', 'Kwota', 'Waluta'];
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

  describe('register', () => {
    it('adds custom bank signature', () => {
      const registry = new BankProfileRegistry();
      registry.register({
        displayName: 'Custom Bank',
        headerPatterns: [['custom_date', 'custom_amount', 'custom_desc']],
      });
      const headers = ['custom_date', 'custom_amount', 'custom_desc'];
      expect(registry.detect(headers)).toBe('Custom Bank');
    });
  });

  describe('detectBankFromHeaders (convenience)', () => {
    it('delegates to default registry', () => {
      const headers = ['Data operacji', 'Opis operacji', 'Kwota', 'Saldo po operacji'];
      expect(detectBankFromHeaders(headers)).toBe('mBank');
    });
  });
});
