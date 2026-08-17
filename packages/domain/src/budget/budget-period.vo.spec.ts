import { describe, it, expect } from 'vitest';
import {
  BudgetPeriod,
  validateBudgetPeriod,
  getCurrentRange,
  getDaysRemaining,
  getTotalDays,
  getDaysElapsed,
} from '#domain/budget/budget-period.vo';

describe('BudgetPeriod', () => {
  describe('validateBudgetPeriod', () => {
    it('accepts monthly period', () => {
      expect(() => validateBudgetPeriod({ type: 'monthly' })).not.toThrow();
    });

    it('accepts yearly period', () => {
      expect(() => validateBudgetPeriod({ type: 'yearly' })).not.toThrow();
    });

    it('accepts valid custom period', () => {
      const period: BudgetPeriod = {
        type: 'custom',
        dateFrom: new Date('2026-07-01'),
        dateTo: new Date('2026-08-31'),
      };
      expect(() => validateBudgetPeriod(period)).not.toThrow();
    });

    it('throws when custom period dateFrom equals dateTo', () => {
      const sameDate = new Date('2026-07-01');
      const period: BudgetPeriod = {
        type: 'custom',
        dateFrom: sameDate,
        dateTo: sameDate,
      };
      expect(() => validateBudgetPeriod(period)).toThrow('Budget custom period dateFrom must be before dateTo');
    });

    it('throws when custom period dateFrom is after dateTo', () => {
      const period: BudgetPeriod = {
        type: 'custom',
        dateFrom: new Date('2026-09-01'),
        dateTo: new Date('2026-07-01'),
      };
      expect(() => validateBudgetPeriod(period)).toThrow('Budget custom period dateFrom must be before dateTo');
    });
  });

  describe('getCurrentRange', () => {
    describe('monthly', () => {
      it('returns first and last day of current month', () => {
        const now = new Date('2026-06-15T12:00:00.000Z');
        const { from, to } = getCurrentRange({ type: 'monthly' }, now);

        expect(from.getFullYear()).toBe(2026);
        expect(from.getMonth()).toBe(5); // June
        expect(from.getDate()).toBe(1);
        expect(to.getFullYear()).toBe(2026);
        expect(to.getMonth()).toBe(5); // June
        expect(to.getDate()).toBe(30); // June has 30 days
      });

      it('handles February correctly', () => {
        const now = new Date('2026-02-14T12:00:00.000Z');
        const { from, to } = getCurrentRange({ type: 'monthly' }, now);

        expect(from.getDate()).toBe(1);
        expect(to.getDate()).toBe(28); // 2026 is not a leap year
      });

      it('handles December correctly', () => {
        const now = new Date('2026-12-25T12:00:00.000Z');
        const { from, to } = getCurrentRange({ type: 'monthly' }, now);

        expect(from.getMonth()).toBe(11);
        expect(from.getDate()).toBe(1);
        expect(to.getMonth()).toBe(11);
        expect(to.getDate()).toBe(31);
      });
    });

    describe('yearly', () => {
      it('returns Jan 1 to Dec 31 of current year', () => {
        const now = new Date('2026-08-13T12:00:00.000Z');
        const { from, to } = getCurrentRange({ type: 'yearly' }, now);

        expect(from.getFullYear()).toBe(2026);
        expect(from.getMonth()).toBe(0);
        expect(from.getDate()).toBe(1);
        expect(to.getFullYear()).toBe(2026);
        expect(to.getMonth()).toBe(11);
        expect(to.getDate()).toBe(31);
      });
    });

    describe('custom', () => {
      it('returns the exact dates specified', () => {
        const dateFrom = new Date('2026-07-01');
        const dateTo = new Date('2026-08-31');
        const period: BudgetPeriod = { type: 'custom', dateFrom, dateTo };

        const { from, to } = getCurrentRange(period, new Date());

        expect(from).toBe(dateFrom);
        expect(to).toBe(dateTo);
      });
    });
  });

  describe('getDaysRemaining', () => {
    it('returns days until end of monthly period', () => {
      const now = new Date(2026, 5, 15, 12, 0, 0); // June 15
      const remaining = getDaysRemaining({ type: 'monthly' }, now);

      // June has 30 days, now is 15th at noon → ~15 days remaining
      expect(remaining).toBeGreaterThan(14);
      expect(remaining).toBeLessThanOrEqual(16);
    });

    it('returns 0 when period has ended', () => {
      const period: BudgetPeriod = {
        type: 'custom',
        dateFrom: new Date('2026-01-01'),
        dateTo: new Date('2026-01-31'),
      };
      const now = new Date('2026-02-15');

      expect(getDaysRemaining(period, now)).toBe(0);
    });

    it('returns positive for future end date', () => {
      const period: BudgetPeriod = {
        type: 'custom',
        dateFrom: new Date('2026-08-01'),
        dateTo: new Date('2026-08-31'),
      };
      const now = new Date('2026-08-13T12:00:00.000Z');

      const remaining = getDaysRemaining(period, now);
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(18);
    });
  });

  describe('getTotalDays', () => {
    it('returns 30 for monthly period in June', () => {
      const now = new Date(2026, 5, 15); // June 15
      const total = getTotalDays({ type: 'monthly' }, now);

      expect(total).toBe(30); // June 1 00:00 to June 30 23:59:59 ≈ 30 days
    });

    it('returns ~365 for yearly period', () => {
      const now = new Date('2026-06-15');
      const total = getTotalDays({ type: 'yearly' }, now);

      expect(total).toBeGreaterThanOrEqual(364);
      expect(total).toBeLessThanOrEqual(366);
    });

    it('returns correct days for custom period', () => {
      const period: BudgetPeriod = {
        type: 'custom',
        dateFrom: new Date('2026-08-01'),
        dateTo: new Date('2026-08-31'),
      };
      const total = getTotalDays(period, new Date('2026-08-15'));

      expect(total).toBe(30);
    });
  });

  describe('getDaysElapsed', () => {
    it('returns days since start of period', () => {
      const now = new Date(2026, 5, 15, 12, 0, 0); // June 15 noon
      const elapsed = getDaysElapsed({ type: 'monthly' }, now);

      expect(elapsed).toBe(14); // June 1 to June 15 = 14 full days
    });

    it('returns 0 when now is before period start', () => {
      const period: BudgetPeriod = {
        type: 'custom',
        dateFrom: new Date('2026-09-01'),
        dateTo: new Date('2026-09-30'),
      };
      const now = new Date('2026-08-15');

      expect(getDaysElapsed(period, now)).toBe(0);
    });

    it('returns 0 on first day of period at start', () => {
      const now = new Date(2026, 5, 1, 0, 0, 0); // June 1 midnight
      const elapsed = getDaysElapsed({ type: 'monthly' }, now);

      expect(elapsed).toBe(0);
    });
  });
});
