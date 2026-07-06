import { describe, it, expect } from 'vitest';
import { Money } from '#domain/transaction/money.vo';
import { DomainError } from '#domain/shared/domain-error';

describe('Money', () => {
  describe('constructor invariants', () => {
    it('throws when amount is negative', () => {
      expect(() => new Money(-1, 'PLN')).toThrow(DomainError);
      expect(() => new Money(-0.01, 'PLN')).toThrow(DomainError);
    });

    it('accepts zero amount', () => {
      const money = new Money(0, 'PLN');
      expect(money.amount).toBe(0);
    });

    it('accepts positive amount', () => {
      const money = new Money(100.50, 'PLN');
      expect(money.amount).toBe(100.50);
    });

    it('throws when currency is not 3 characters', () => {
      expect(() => new Money(100, 'PL')).toThrow(DomainError);
      expect(() => new Money(100, 'PLNX')).toThrow(DomainError);
      expect(() => new Money(100, '')).toThrow(DomainError);
    });

    it('accepts valid 3-letter currency code', () => {
      const money = new Money(100, 'EUR');
      expect(money.currency).toBe('EUR');
    });
  });

  describe('of (factory)', () => {
    it('creates Money with uppercased currency', () => {
      const money = Money.of(100, 'pln');
      expect(money.amount).toBe(100);
      expect(money.currency).toBe('PLN');
    });

    it('validates amount and currency', () => {
      expect(() => Money.of(-1, 'PLN')).toThrow(DomainError);
      expect(() => Money.of(100, 'AB')).toThrow(DomainError);
    });
  });

  describe('add', () => {
    it('adds two Money values of same currency', () => {
      const a = Money.of(100, 'PLN');
      const b = Money.of(50, 'PLN');
      const result = a.add(b);
      expect(result.amount).toBe(150);
      expect(result.currency).toBe('PLN');
    });

    it('throws on currency mismatch', () => {
      const a = Money.of(100, 'PLN');
      const b = Money.of(50, 'EUR');
      expect(() => a.add(b)).toThrow(DomainError);
    });

    it('returns new instance (immutable)', () => {
      const a = Money.of(100, 'PLN');
      const b = Money.of(50, 'PLN');
      const result = a.add(b);
      expect(result).not.toBe(a);
      expect(a.amount).toBe(100);
    });
  });

  describe('subtract', () => {
    it('subtracts when result is positive', () => {
      const a = Money.of(100, 'PLN');
      const b = Money.of(30, 'PLN');
      const result = a.subtract(b);
      expect(result.amount).toBe(70);
      expect(result.currency).toBe('PLN');
    });

    it('returns zero when subtracting equal amounts', () => {
      const a = Money.of(100, 'PLN');
      const b = Money.of(100, 'PLN');
      const result = a.subtract(b);
      expect(result.amount).toBe(0);
    });

    it('throws when result would be negative', () => {
      const a = Money.of(50, 'PLN');
      const b = Money.of(100, 'PLN');
      expect(() => a.subtract(b)).toThrow(DomainError);
    });

    it('throws on currency mismatch', () => {
      const a = Money.of(100, 'PLN');
      const b = Money.of(50, 'EUR');
      expect(() => a.subtract(b)).toThrow(DomainError);
    });
  });

  describe('isZero', () => {
    it('returns true for zero amount', () => {
      expect(Money.of(0, 'PLN').isZero()).toBe(true);
    });

    it('returns false for non-zero amount', () => {
      expect(Money.of(1, 'PLN').isZero()).toBe(false);
    });
  });

  describe('equals', () => {
    it('returns true for same amount and currency', () => {
      const a = Money.of(100, 'PLN');
      const b = Money.of(100, 'PLN');
      expect(a.equals(b)).toBe(true);
    });

    it('returns false for different amounts', () => {
      const a = Money.of(100, 'PLN');
      const b = Money.of(99, 'PLN');
      expect(a.equals(b)).toBe(false);
    });

    it('returns false for different currencies', () => {
      const a = Money.of(100, 'PLN');
      const b = Money.of(100, 'EUR');
      expect(a.equals(b)).toBe(false);
    });
  });
});
