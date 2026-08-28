import { describe, expect, it } from 'vitest';

import { detectDataBoundaries } from '#features/csv-import/model/parsing/data-boundary-detector/detect-data-boundaries';

describe('detectDataBoundaries', () => {
  describe('header detection', () => {
    it('finds header row with keyword columns', () => {
      const text = [
        'Data operacji;Opis;Kwota;Saldo',
        '15.06.2025;BIEDRONKA;-87,43;3840,67',
        '14.06.2025;ZUS;-2635,98;3928,10',
      ].join('\n');

      const result = detectDataBoundaries(text, ';');
      expect(result.headerRow).toBe(0);
      expect(result.dataStartRow).toBe(1);
      expect(result.skipRows).toBe(0);
    });

    it('skips metadata lines before header', () => {
      const text = [
        'mBank S.A.',
        'Rachunek: 1234567890',
        '',
        'Data operacji;Opis;Kwota;Saldo',
        '15.06.2025;BIEDRONKA;-87,43;3840,67',
      ].join('\n');

      const result = detectDataBoundaries(text, ';');
      expect(result.headerRow).toBe(3);
      expect(result.dataStartRow).toBe(4);
      expect(result.skipRows).toBe(3);
    });
  });

  describe('headerless detection', () => {
    it('returns null headerRow when no keyword header found', () => {
      const text = [
        '15.06.2025;BIEDRONKA;-87,43;3840,67',
        '14.06.2025;ZUS;-2635,98;3928,10',
      ].join('\n');

      const result = detectDataBoundaries(text, ';');
      expect(result.headerRow).toBeNull();
      expect(result.dataStartRow).toBe(0);
    });
  });

  describe('date-based first data row', () => {
    it('finds first row with date pattern in field[0]', () => {
      const text = [
        'Bank Name',
        'Account: 123',
        'Data;Opis;Kwota',
        '2025-06-15;Payment;-100.00',
        '2025-06-14;Transfer;500.00',
      ].join('\n');

      const result = detectDataBoundaries(text, ';');
      expect(result.dataStartRow).toBe(3);
    });
  });
});
