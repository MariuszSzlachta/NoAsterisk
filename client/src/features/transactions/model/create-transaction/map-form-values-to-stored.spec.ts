// ═══════════════════════════════════════════════════════════════════
// Transactions Feature — mapFormValuesToStored Tests
// ═══════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';

import type { CreateTransactionFormValues } from './types';
import { mapFormValuesToStored } from './map-form-values-to-stored';

// ─── Test Data Builders ──────────────────────────────────────────

const buildFormValues = (
  overrides?: Partial<CreateTransactionFormValues>,
): CreateTransactionFormValues => ({
  title: 'Biedronka zakupy',
  amount: '87.50',
  date: '2026-08-20',
  type: 'expense',
  categoryId: '',
  ...overrides,
});

// ─── Tests ───────────────────────────────────────────────────────

describe('mapFormValuesToStored', () => {
  describe('id generation', () => {
    it('generates a UUID string', () => {
      const result = mapFormValuesToStored(buildFormValues());

      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it('generates unique ids across calls', () => {
      const result1 = mapFormValuesToStored(buildFormValues());
      const result2 = mapFormValuesToStored(buildFormValues());

      expect(result1.id).not.toBe(result2.id);
    });
  });

  describe('title trimming', () => {
    it('trims whitespace from title', () => {
      const result = mapFormValuesToStored(buildFormValues({ title: '  Biedronka  ' }));

      expect(result.description).toBe('Biedronka');
    });

    it('preserves internal spaces', () => {
      const result = mapFormValuesToStored(buildFormValues({ title: 'Kawa w kawiarni' }));

      expect(result.description).toBe('Kawa w kawiarni');
    });
  });

  describe('amount sign logic', () => {
    it('stores negative amount for expense', () => {
      const result = mapFormValuesToStored(buildFormValues({ type: 'expense', amount: '87.50' }));

      expect(result.amount).toBe(-87.5);
    });

    it('stores positive amount for income', () => {
      const result = mapFormValuesToStored(buildFormValues({ type: 'income', amount: '8500' }));

      expect(result.amount).toBe(8500);
    });

    it('ensures negative for expense even if amount string is negative', () => {
      const result = mapFormValuesToStored(buildFormValues({ type: 'expense', amount: '-50' }));

      expect(result.amount).toBe(-50);
    });

    it('ensures positive for income even if amount string is negative', () => {
      const result = mapFormValuesToStored(buildFormValues({ type: 'income', amount: '-50' }));

      expect(result.amount).toBe(50);
    });
  });

  describe('categoryId coercion', () => {
    it('converts empty string to undefined', () => {
      const result = mapFormValuesToStored(buildFormValues({ categoryId: '' }));

      expect(result.categoryId).toBeUndefined();
    });

    it('preserves non-empty categoryId', () => {
      const result = mapFormValuesToStored(buildFormValues({ categoryId: 'cat-groceries' }));

      expect(result.categoryId).toBe('cat-groceries');
    });
  });

  describe('constants', () => {
    it('sets currency to PLN', () => {
      const result = mapFormValuesToStored(buildFormValues());

      expect(result.currency).toBe('PLN');
    });

    it('sets batchId to manual', () => {
      const result = mapFormValuesToStored(buildFormValues());

      expect(result.batchId).toBe('manual');
    });
  });

  describe('contentHash', () => {
    it('generates a UUID for contentHash', () => {
      const result = mapFormValuesToStored(buildFormValues());

      expect(result.contentHash).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it('generates unique contentHash across calls', () => {
      const result1 = mapFormValuesToStored(buildFormValues());
      const result2 = mapFormValuesToStored(buildFormValues());

      expect(result1.contentHash).not.toBe(result2.contentHash);
    });
  });

  describe('importedAt', () => {
    it('sets importedAt as ISO timestamp', () => {
      const before = new Date().toISOString();
      const result = mapFormValuesToStored(buildFormValues());
      const after = new Date().toISOString();

      expect(result.importedAt >= before).toBe(true);
      expect(result.importedAt <= after).toBe(true);
    });
  });

  describe('date passthrough', () => {
    it('preserves date string as-is', () => {
      const result = mapFormValuesToStored(buildFormValues({ date: '2025-01-15' }));

      expect(result.date).toBe('2025-01-15');
    });
  });
});
