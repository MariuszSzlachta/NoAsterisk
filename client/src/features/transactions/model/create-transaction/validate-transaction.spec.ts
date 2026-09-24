// ═══════════════════════════════════════════════════════════════════
// Transactions Feature — Create Transaction Validation Tests
// ═══════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';

import type { CreateTransactionFormValues } from './types';
import { hasErrors, validateCreateTransaction } from './validate-transaction';

// ─── Test Data Builders ──────────────────────────────────────────

const buildValidValues = (
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

describe('validateCreateTransaction', () => {
  describe('happy path', () => {
    it('returns no errors for valid expense', () => {
      const errors = validateCreateTransaction(buildValidValues());

      expect(hasErrors(errors)).toBe(false);
    });

    it('returns no errors for valid income', () => {
      const errors = validateCreateTransaction(
        buildValidValues({ type: 'income', amount: '8500' }),
      );

      expect(hasErrors(errors)).toBe(false);
    });

    it('returns no errors for amount without decimals', () => {
      const errors = validateCreateTransaction(buildValidValues({ amount: '100' }));

      expect(hasErrors(errors)).toBe(false);
    });

    it('returns no errors for today date', () => {
      const today = new Date().toISOString().slice(0, 10);
      const errors = validateCreateTransaction(buildValidValues({ date: today }));

      expect(hasErrors(errors)).toBe(false);
    });
  });

  describe('title validation', () => {
    it('returns error for empty title', () => {
      const errors = validateCreateTransaction(buildValidValues({ title: '' }));

      expect(errors.title).toBe('Tytuł jest wymagany');
    });

    it('returns error for whitespace-only title', () => {
      const errors = validateCreateTransaction(buildValidValues({ title: '   ' }));

      expect(errors.title).toBe('Tytuł jest wymagany');
    });

    it('returns error for title exceeding 200 chars', () => {
      const longTitle = 'a'.repeat(201);
      const errors = validateCreateTransaction(buildValidValues({ title: longTitle }));

      expect(errors.title).toBe('Maksymalnie 200 znaków');
    });

    it('accepts title with exactly 200 chars', () => {
      const maxTitle = 'a'.repeat(200);
      const errors = validateCreateTransaction(buildValidValues({ title: maxTitle }));

      expect(errors.title).toBeUndefined();
    });

    it('trims title before length check', () => {
      const paddedTitle = ' ' + 'a'.repeat(200) + ' ';
      const errors = validateCreateTransaction(buildValidValues({ title: paddedTitle }));

      expect(errors.title).toBeUndefined();
    });
  });

  describe('amount validation', () => {
    it('returns error for empty amount', () => {
      const errors = validateCreateTransaction(buildValidValues({ amount: '' }));

      expect(errors.amount).toBe('Kwota jest wymagana');
    });

    it('returns error for zero amount', () => {
      const errors = validateCreateTransaction(buildValidValues({ amount: '0' }));

      expect(errors.amount).toBe('Kwota musi być liczbą większą od 0');
    });

    it('returns error for negative amount', () => {
      const errors = validateCreateTransaction(buildValidValues({ amount: '-10' }));

      expect(errors.amount).toBe('Kwota musi być liczbą większą od 0');
    });

    it('returns error for non-numeric string', () => {
      const errors = validateCreateTransaction(buildValidValues({ amount: 'abc' }));

      expect(errors.amount).toBe('Kwota musi być liczbą większą od 0');
    });

    it('returns error for more than 2 decimal places', () => {
      const errors = validateCreateTransaction(buildValidValues({ amount: '10.123' }));

      expect(errors.amount).toBe('Maksymalnie 2 miejsca po przecinku');
    });

    it('accepts amount with exactly 2 decimal places', () => {
      const errors = validateCreateTransaction(buildValidValues({ amount: '10.99' }));

      expect(errors.amount).toBeUndefined();
    });

    it('accepts amount with 1 decimal place', () => {
      const errors = validateCreateTransaction(buildValidValues({ amount: '10.5' }));

      expect(errors.amount).toBeUndefined();
    });

    it('trims whitespace from amount', () => {
      const errors = validateCreateTransaction(buildValidValues({ amount: ' 50 ' }));

      expect(errors.amount).toBeUndefined();
    });

    it('returns error for amount exceeding max (99,999,999.99)', () => {
      const errors = validateCreateTransaction(buildValidValues({ amount: '100000000' }));

      expect(errors.amount).toBe('Kwota jest zbyt duża');
    });

    it('accepts amount at max boundary', () => {
      const errors = validateCreateTransaction(buildValidValues({ amount: '99999999.99' }));

      expect(errors.amount).toBeUndefined();
    });

    it('returns error for comma-as-decimal (Polish locale input)', () => {
      const errors = validateCreateTransaction(buildValidValues({ amount: '87,50' }));

      expect(errors.amount).toBe('Kwota musi być liczbą większą od 0');
    });

    it('returns error for zero with decimals (0.00)', () => {
      const errors = validateCreateTransaction(buildValidValues({ amount: '0.00' }));

      expect(errors.amount).toBe('Kwota musi być liczbą większą od 0');
    });
  });

  describe('date validation', () => {
    it('returns error for empty date', () => {
      const errors = validateCreateTransaction(buildValidValues({ date: '' }));

      expect(errors.date).toBe('Data jest wymagana');
    });

    it('returns error for invalid date format', () => {
      const errors = validateCreateTransaction(buildValidValues({ date: 'not-a-date' }));

      expect(errors.date).toBe('Nieprawidłowa data');
    });

    it('returns error for future date', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().slice(0, 10);

      const errors = validateCreateTransaction(buildValidValues({ date: futureDate }));

      expect(errors.date).toBe('Data nie może być z przyszłości');
    });

    it('accepts past date', () => {
      const errors = validateCreateTransaction(buildValidValues({ date: '2025-01-15' }));

      expect(errors.date).toBeUndefined();
    });
  });

  describe('type validation', () => {
    it('returns error for invalid type', () => {
      const values = buildValidValues({ type: 'invalid' satisfies 'income' | 'expense' });
      const errors = validateCreateTransaction(values);

      expect(errors.type).toBe('Wybierz typ transakcji');
    });

    it('accepts income type', () => {
      const errors = validateCreateTransaction(buildValidValues({ type: 'income' }));

      expect(errors.type).toBeUndefined();
    });

    it('accepts expense type', () => {
      const errors = validateCreateTransaction(buildValidValues({ type: 'expense' }));

      expect(errors.type).toBeUndefined();
    });
  });

  describe('hasErrors', () => {
    it('returns false when all fields are undefined', () => {
      const errors = validateCreateTransaction(buildValidValues());

      expect(hasErrors(errors)).toBe(false);
    });

    it('returns true when any field has error', () => {
      const errors = validateCreateTransaction(buildValidValues({ title: '' }));

      expect(hasErrors(errors)).toBe(true);
    });

    it('returns true with multiple errors', () => {
      const errors = validateCreateTransaction(
        buildValidValues({ title: '', amount: '', date: '' }),
      );

      expect(hasErrors(errors)).toBe(true);
    });
  });
});
