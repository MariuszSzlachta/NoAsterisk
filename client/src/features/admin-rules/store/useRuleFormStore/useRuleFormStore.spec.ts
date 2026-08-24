import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useRuleFormStore } from './useRuleFormStore';

// ─── Reset ───────────────────────────────────────────────────────

beforeEach(() => {
  useRuleFormStore.setState({ showForm: false, editingRuleId: undefined });
});

// ─── Tests ───────────────────────────────────────────────────────

describe('useRuleFormStore', () => {
  describe('initial state', () => {
    it('starts with form hidden', () => {
      expect(useRuleFormStore.getState().showForm).toBe(false);
    });

    it('starts with no editing rule', () => {
      expect(useRuleFormStore.getState().editingRuleId).toBeUndefined();
    });
  });

  describe('openAddForm', () => {
    it('opens the form', () => {
      act(() => { useRuleFormStore.getState().openAddForm(); });

      expect(useRuleFormStore.getState().showForm).toBe(true);
    });

    it('clears editingRuleId', () => {
      useRuleFormStore.setState({ editingRuleId: 'r-existing' });

      act(() => { useRuleFormStore.getState().openAddForm(); });

      expect(useRuleFormStore.getState().editingRuleId).toBeUndefined();
    });
  });

  describe('openEditForm', () => {
    it('opens the form', () => {
      act(() => { useRuleFormStore.getState().openEditForm('r-123'); });

      expect(useRuleFormStore.getState().showForm).toBe(true);
    });

    it('sets editingRuleId', () => {
      act(() => { useRuleFormStore.getState().openEditForm('r-456'); });

      expect(useRuleFormStore.getState().editingRuleId).toBe('r-456');
    });
  });

  describe('closeForm', () => {
    it('hides the form', () => {
      useRuleFormStore.setState({ showForm: true });

      act(() => { useRuleFormStore.getState().closeForm(); });

      expect(useRuleFormStore.getState().showForm).toBe(false);
    });

    it('clears editingRuleId', () => {
      useRuleFormStore.setState({ showForm: true, editingRuleId: 'r-999' });

      act(() => { useRuleFormStore.getState().closeForm(); });

      expect(useRuleFormStore.getState().editingRuleId).toBeUndefined();
    });
  });
});
