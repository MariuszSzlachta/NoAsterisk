import { describe, expect, it } from 'vitest';

import { Money } from '#entities/value-objects/money';
import { DomainError } from '#shared/lib/domain-error';

describe('Money', () => {
  describe('creation', () => {
    it('creates instance with amount and uppercase currency', () => {
      const money = Money.of(100, 'pln');

      expect(money.amount).toBe(100);
      expect(money.currency).toBe('PLN');
    });

    it('throws DomainError when currency is empty', () => {
      expect(() => Money.of(100, '')).toThrow(DomainError);
      expect(() => Money.of(100, '  ')).toThrow(DomainError);
    });

    it('creates zero money', () => {
      const money = Money.zero('PLN');

      expect(money.amount).toBe(0);
      expect(money.isZero()).toBe(true);
    });

    it('allows negative amounts', () => {
      const money = Money.of(-50, 'PLN');

      expect(money.amount).toBe(-50);
      expect(money.isNegative()).toBe(true);
    });
  });

  describe('arithmetic', () => {
    it('adds two amounts with same currency', () => {
      const a = Money.of(100, 'PLN');
      const b = Money.of(50, 'PLN');

      expect(a.add(b).amount).toBe(150);
    });

    it('subtracts two amounts with same currency', () => {
      const a = Money.of(100, 'PLN');
      const b = Money.of(30, 'PLN');

      expect(a.subtract(b).amount).toBe(70);
    });

    it('multiplies by factor', () => {
      const money = Money.of(100, 'PLN');

      expect(money.multiply(2.5).amount).toBe(250);
    });

    it('negates amount', () => {
      const money = Money.of(100, 'PLN');

      expect(money.negate().amount).toBe(-100);
    });

    it('throws on currency mismatch in add', () => {
      const pln = Money.of(100, 'PLN');
      const eur = Money.of(50, 'EUR');

      expect(() => pln.add(eur)).toThrow('Currency mismatch');
    });

    it('throws on currency mismatch in subtract', () => {
      const pln = Money.of(100, 'PLN');
      const eur = Money.of(50, 'EUR');

      expect(() => pln.subtract(eur)).toThrow('Currency mismatch');
    });
  });

  describe('predicates', () => {
    it.each([
      { amount: 0, isZero: true, isNegative: false, isPositive: false },
      { amount: 100, isZero: false, isNegative: false, isPositive: true },
      { amount: -50, isZero: false, isNegative: true, isPositive: false },
    ])('amount $amount → isZero=$isZero, isNegative=$isNegative, isPositive=$isPositive', ({ amount, isZero, isNegative, isPositive }) => {
      const money = Money.of(amount, 'PLN');

      expect(money.isZero()).toBe(isZero);
      expect(money.isNegative()).toBe(isNegative);
      expect(money.isPositive()).toBe(isPositive);
    });
  });

  describe('equality', () => {
    it('returns true for same amount and currency', () => {
      expect(Money.of(100, 'PLN').equals(Money.of(100, 'PLN'))).toBe(true);
    });

    it('returns false for different amount', () => {
      expect(Money.of(100, 'PLN').equals(Money.of(99, 'PLN'))).toBe(false);
    });

    it('returns false for different currency', () => {
      expect(Money.of(100, 'PLN').equals(Money.of(100, 'EUR'))).toBe(false);
    });
  });

  describe('format', () => {
    it('formats in PLN locale', () => {
      const formatted = Money.of(1234.56, 'PLN').format('pl-PL');

      expect(formatted).toContain('1');
      expect(formatted).toContain('234');
      expect(formatted).toContain('56');
    });
  });
});
