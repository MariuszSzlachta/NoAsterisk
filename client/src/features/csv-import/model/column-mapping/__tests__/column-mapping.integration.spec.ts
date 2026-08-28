import { describe, expect, it } from 'vitest';

import { autoDetectMapping } from '#features/csv-import/model/column-mapping/auto-detect';
import { createBankProfileRegistry } from '#features/csv-import/model/column-mapping/bank-profiles/create-bank-profile-registry';
import { detectBankFromHeaders } from '#features/csv-import/model/column-mapping/bank-profiles/detect-bank-from-headers';
import { createHeuristicRegistry } from '#features/csv-import/model/column-mapping/heuristics/create-heuristic-registry';
import { hasRequiredFields } from '#features/csv-import/model/column-mapping/validators/has-required-fields';

describe('column-mapping integration', () => {
  describe('autoDetect + hasRequiredFields pipeline', () => {
    it('auto-detects mBank headers and produces valid mapping', () => {
      const headers = [
        '#Data operacji',
        '#Opis operacji',
        '#Kwota',
        '#Saldo po operacji',
      ];
      const mapping = autoDetectMapping(headers);
      expect(hasRequiredFields(mapping)).toBe(true);
    });

    it('auto-detects PKO BP quoted headers and produces valid mapping', () => {
      const headers = [
        '"Data operacji"',
        '"Data waluty"',
        '"Opis"',
        '"Kwota"',
        '"Waluta"',
      ];
      const mapping = autoDetectMapping(headers);
      expect(hasRequiredFields(mapping)).toBe(true);
    });

    it('auto-detects Millennium debit/credit headers and produces valid mapping', () => {
      const headers = ['Data', 'Opis', 'Obciążenia', 'Uznania', 'Saldo'];
      const mapping = autoDetectMapping(headers);
      expect(hasRequiredFields(mapping)).toBe(true);
    });

    it('returns invalid mapping for unrecognizable headers', () => {
      const headers = ['ID', 'Timestamp', 'Foo', 'Bar'];
      const mapping = autoDetectMapping(headers);
      expect(hasRequiredFields(mapping)).toBe(false);
    });
  });

  describe('detectBank + autoDetect end-to-end', () => {
    it('detects bank and maps headers for mBank CSV', () => {
      const headers = [
        '#Data operacji',
        '#Data księgowania',
        '#Opis operacji',
        '#Tytuł',
        '#Kwota',
        '#Saldo po operacji',
      ];
      const bank = detectBankFromHeaders(headers);
      const mapping = autoDetectMapping(headers);

      expect(bank).toBe('mBank');
      expect(mapping['#Data operacji']).toBe('date');
      expect(mapping['#Opis operacji']).toBe('title');
      expect(mapping['#Kwota']).toBe('amount');
      expect(mapping['#Saldo po operacji']).toBe('balance');
      expect(hasRequiredFields(mapping)).toBe(true);
    });

    it('detects bank and maps headers for ING CSV', () => {
      const headers = [
        'Data transakcji',
        'Dane kontrahenta',
        'Tytuł',
        'Kwota',
        'Waluta',
      ];
      const bank = detectBankFromHeaders(headers);
      const mapping = autoDetectMapping(headers);

      expect(bank).toBe('ING');
      expect(hasRequiredFields(mapping)).toBe(true);
    });
  });

  describe('custom registry extension', () => {
    it('custom heuristic overrides builtin in auto-detect', () => {
      const customRegistry = createHeuristicRegistry().register({
        normalized: 'moje pole',
        field: 'date',
        source: 'user',
      });
      const mapping = autoDetectMapping(
        ['Moje pole', 'Opis', 'Kwota'],
        customRegistry,
      );
      expect(mapping['Moje pole']).toBe('date');
      expect(hasRequiredFields(mapping)).toBe(true);
    });

    it('custom bank signature detects new bank', () => {
      const customRegistry = createBankProfileRegistry().register({
        displayName: 'MyBank',
        headerPatterns: [['my_date', 'my_amount', 'my_title']],
      });
      expect(
        customRegistry.detect(['my_date', 'my_amount', 'my_title']),
      ).toBe('MyBank');
    });
  });
});
