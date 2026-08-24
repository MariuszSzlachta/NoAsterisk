import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useBudgetsPageStore } from '#features/budgets';

// ─── Reset ───────────────────────────────────────────────────────

beforeEach(() => {
  const { setState } = useBudgetsPageStore;
  setState({
    activeTab: 'all',
    selectedPeriod: 'monthly',
    customRange: undefined,
    isSavingsFormOpen: false,
    closingBudgetId: null,
  });
});

// ─── Tests ───────────────────────────────────────────────────────

describe('useBudgetsPageStore', () => {
  describe('activeTab', () => {
    it('starts with "all" as default', () => {
      expect(useBudgetsPageStore.getState().activeTab).toBe('all');
    });

    it('sets active tab', () => {
      act(() => {
        useBudgetsPageStore.getState().setActiveTab('needsAttention');
      });

      expect(useBudgetsPageStore.getState().activeTab).toBe('needsAttention');
    });
  });

  describe('selectedPeriod', () => {
    it('starts with "monthly" as default', () => {
      expect(useBudgetsPageStore.getState().selectedPeriod).toBe('monthly');
    });

    it('sets selected period', () => {
      act(() => {
        useBudgetsPageStore.getState().setSelectedPeriod('yearly');
      });

      expect(useBudgetsPageStore.getState().selectedPeriod).toBe('yearly');
    });
  });

  describe('customRange', () => {
    it('starts as undefined', () => {
      expect(useBudgetsPageStore.getState().customRange).toBeUndefined();
    });

    it('sets custom range', () => {
      const range = { from: new Date('2026-01-01'), to: new Date('2026-01-31') };

      act(() => {
        useBudgetsPageStore.getState().setCustomRange(range);
      });

      expect(useBudgetsPageStore.getState().customRange).toEqual(range);
    });

    it('clears custom range', () => {
      act(() => {
        useBudgetsPageStore.getState().setCustomRange({ from: new Date() });
      });
      act(() => {
        useBudgetsPageStore.getState().setCustomRange(undefined);
      });

      expect(useBudgetsPageStore.getState().customRange).toBeUndefined();
    });
  });

  describe('savings form', () => {
    it('starts closed', () => {
      expect(useBudgetsPageStore.getState().isSavingsFormOpen).toBe(false);
    });

    it('opens savings form', () => {
      act(() => {
        useBudgetsPageStore.getState().openSavingsForm();
      });

      expect(useBudgetsPageStore.getState().isSavingsFormOpen).toBe(true);
    });

    it('closes savings form', () => {
      act(() => {
        useBudgetsPageStore.getState().openSavingsForm();
      });
      act(() => {
        useBudgetsPageStore.getState().closeSavingsForm();
      });

      expect(useBudgetsPageStore.getState().isSavingsFormOpen).toBe(false);
    });
  });

  describe('closure modal', () => {
    it('starts with null closingBudgetId', () => {
      expect(useBudgetsPageStore.getState().closingBudgetId).toBeNull();
    });

    it('opens closure modal with budget id', () => {
      act(() => {
        useBudgetsPageStore.getState().openClosureModal('budget-123');
      });

      expect(useBudgetsPageStore.getState().closingBudgetId).toBe('budget-123');
    });

    it('closes closure modal', () => {
      act(() => {
        useBudgetsPageStore.getState().openClosureModal('budget-123');
      });
      act(() => {
        useBudgetsPageStore.getState().closeClosureModal();
      });

      expect(useBudgetsPageStore.getState().closingBudgetId).toBeNull();
    });
  });
});
