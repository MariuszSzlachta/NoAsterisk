import { describe, it, expect } from 'vitest';
import { computeBudgetStatus, getStatusLabelKey } from './budget-status';

describe('computeBudgetStatus', () => {
  describe('awaitingClosure', () => {
    it('returns awaitingClosure when periodEnded is true', () => {
      expect(computeBudgetStatus(500, 2000, 30, 30, 5, true)).toBe('awaitingClosure');
    });

    it('returns awaitingClosure regardless of spending when periodEnded', () => {
      expect(computeBudgetStatus(0, 2000, 30, 30, 0, true)).toBe('awaitingClosure');
    });

    it('returns awaitingClosure even when over budget and periodEnded', () => {
      expect(computeBudgetStatus(3000, 2000, 30, 30, 10, true)).toBe('awaitingClosure');
    });

    it('does not return awaitingClosure when periodEnded is false', () => {
      expect(computeBudgetStatus(500, 2000, 15, 30, 5, false)).not.toBe('awaitingClosure');
    });

    it('does not return awaitingClosure when periodEnded is undefined', () => {
      expect(computeBudgetStatus(500, 2000, 15, 30, 5)).not.toBe('awaitingClosure');
    });
  });

  describe('newPeriod', () => {
    it('returns newPeriod when totalTransactions is 0', () => {
      expect(computeBudgetStatus(0, 2000, 5, 30, 0)).toBe('newPeriod');
    });

    it('returns newPeriod regardless of other values when no transactions', () => {
      expect(computeBudgetStatus(0, 0, 15, 30, 0)).toBe('newPeriod');
    });
  });

  describe('overBudget', () => {
    it('returns overBudget when spent exceeds limit', () => {
      expect(computeBudgetStatus(2500, 2000, 15, 30, 5)).toBe('overBudget');
    });

    it('returns overBudget when spent barely exceeds limit', () => {
      expect(computeBudgetStatus(2001, 2000, 1, 30, 1)).toBe('overBudget');
    });
  });

  describe('warning', () => {
    it('returns warning when spent ratio > time ratio and spent > 70%', () => {
      // 80% spent at 40% time
      expect(computeBudgetStatus(1600, 2000, 12, 30, 3)).toBe('warning');
    });

    it('returns warning at 75% spent and 50% time', () => {
      expect(computeBudgetStatus(1500, 2000, 15, 30, 4)).toBe('warning');
    });
  });

  describe('surplus', () => {
    it('returns surplus when spent < 50% and time > 50%', () => {
      // 30% spent at 60% time
      expect(computeBudgetStatus(600, 2000, 18, 30, 3)).toBe('surplus');
    });

    it('returns surplus when spent is very low and time advanced', () => {
      // 10% spent at 80% time
      expect(computeBudgetStatus(200, 2000, 24, 30, 2)).toBe('surplus');
    });
  });

  describe('onTrack', () => {
    it('returns onTrack for normal spending pace', () => {
      // 50% spent at 50% time
      expect(computeBudgetStatus(1000, 2000, 15, 30, 5)).toBe('onTrack');
    });

    it('returns onTrack when spent is 60% at 50% time (below warning threshold)', () => {
      // 60% spent at 50% time — spentRatio > timeRatio but not > 70%
      expect(computeBudgetStatus(1200, 2000, 15, 30, 3)).toBe('onTrack');
    });

    it('returns onTrack when spent is 50% at 60% time (not surplus — exactly 50%)', () => {
      // 50% spent at 60% time — not < 50% so not surplus
      expect(computeBudgetStatus(1000, 2000, 18, 30, 3)).toBe('onTrack');
    });
  });

  describe('edge cases', () => {
    it('handles zero limit gracefully', () => {
      expect(computeBudgetStatus(100, 0, 15, 30, 1)).toBe('overBudget');
    });

    it('handles zero totalDays gracefully', () => {
      expect(computeBudgetStatus(500, 2000, 0, 0, 1)).toBe('onTrack');
    });

    it('handles zero spent with transactions (surplus when time > 50%)', () => {
      // 0% spent at 60% time → surplus
      expect(computeBudgetStatus(0, 2000, 18, 30, 1)).toBe('surplus');
    });

    it('handles zero spent at early time (onTrack)', () => {
      // 0% spent at 17% time → onTrack (time not past 50%)
      expect(computeBudgetStatus(0, 2000, 5, 30, 1)).toBe('onTrack');
    });
  });
});

describe('getStatusLabelKey', () => {
  it('returns correct i18n keys', () => {
    expect(getStatusLabelKey('awaitingClosure')).toBe('budgets.status.awaitingClosure');
    expect(getStatusLabelKey('overBudget')).toBe('budgets.status.overBudget');
    expect(getStatusLabelKey('warning')).toBe('budgets.status.warning');
    expect(getStatusLabelKey('onTrack')).toBe('budgets.status.onTrack');
    expect(getStatusLabelKey('surplus')).toBe('budgets.status.surplus');
    expect(getStatusLabelKey('newPeriod')).toBe('budgets.status.newPeriod');
  });
});
