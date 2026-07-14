import { describe, expect, it, beforeEach } from 'vitest';

import { useImportWizardStore } from './useImportWizardStore';

// ─── Tests ───────────────────────────────────────────────────────

describe('useImportWizardStore', () => {
  beforeEach(() => {
    useImportWizardStore.getState().reset();
  });

  describe('navigation', () => {
    it('starts at step 0', () => {
      expect(useImportWizardStore.getState().step).toBe(0);
    });

    it('nextStep increments step by 1', () => {
      useImportWizardStore.getState().nextStep();

      expect(useImportWizardStore.getState().step).toBe(1);
    });

    it('prevStep decrements step by 1', () => {
      useImportWizardStore.setState({ step: 3 });

      useImportWizardStore.getState().prevStep();

      expect(useImportWizardStore.getState().step).toBe(2);
    });

    it('nextStep does not exceed step 4', () => {
      useImportWizardStore.setState({ step: 4 });

      useImportWizardStore.getState().nextStep();

      expect(useImportWizardStore.getState().step).toBe(4);
    });

    it('prevStep does not go below step 0', () => {
      useImportWizardStore.getState().prevStep();

      expect(useImportWizardStore.getState().step).toBe(0);
    });

    it('setStep sets exact step value', () => {
      useImportWizardStore.getState().setStep(3);

      expect(useImportWizardStore.getState().step).toBe(3);
    });
  });

  describe('column mapping', () => {
    it('setDetectedMapping sets both detectedMapping and columnMapping', () => {
      const mapping = { date: 'date', title: 'title', amount: 'amount' };

      useImportWizardStore.getState().setDetectedMapping(mapping as never);

      const state = useImportWizardStore.getState();
      expect(state.detectedMapping).toEqual(mapping);
      expect(state.columnMapping).toEqual(mapping);
    });

    it('updateColumnMapping adds a field mapping', () => {
      useImportWizardStore.getState().updateColumnMapping('col1', 'date' as never);

      expect(useImportWizardStore.getState().columnMapping).toEqual({ col1: 'date' });
    });

    it('updateColumnMapping removes a field when undefined', () => {
      useImportWizardStore.setState({ columnMapping: { col1: 'date' } as never });

      useImportWizardStore.getState().updateColumnMapping('col1', undefined);

      expect(useImportWizardStore.getState().columnMapping).toEqual({});
    });
  });

  describe('updateRow', () => {
    it('updates title of existing row', () => {
      useImportWizardStore.setState({
        rows: [
          { id: 'r1', date: '2026-01-01', title: 'OLD', amount: -50, currency: 'PLN', status: 'ok' },
          { id: 'r2', date: '2026-01-02', title: 'OTHER', amount: -30, currency: 'PLN', status: 'ok' },
        ],
      });

      useImportWizardStore.getState().updateRow('r1', { title: 'NEW TITLE' });

      const row = useImportWizardStore.getState().rows.find((r) => r.id === 'r1');
      expect(row?.title).toBe('NEW TITLE');
    });

    it('updates category of existing row', () => {
      useImportWizardStore.setState({
        rows: [
          { id: 'r1', date: '2026-01-01', title: 'Test', amount: -50, currency: 'PLN', status: 'ok' },
        ],
      });

      useImportWizardStore.getState().updateRow('r1', { category: 'Groceries' });

      const row = useImportWizardStore.getState().rows.find((r) => r.id === 'r1');
      expect(row?.category).toBe('Groceries');
    });

    it('does not modify other rows', () => {
      useImportWizardStore.setState({
        rows: [
          { id: 'r1', date: '2026-01-01', title: 'A', amount: -50, currency: 'PLN', status: 'ok' },
          { id: 'r2', date: '2026-01-02', title: 'B', amount: -30, currency: 'PLN', status: 'ok' },
        ],
      });

      useImportWizardStore.getState().updateRow('r1', { title: 'CHANGED' });

      const r2 = useImportWizardStore.getState().rows.find((r) => r.id === 'r2');
      expect(r2?.title).toBe('B');
    });

    it('does nothing for non-existing row id', () => {
      useImportWizardStore.setState({
        rows: [
          { id: 'r1', date: '2026-01-01', title: 'A', amount: -50, currency: 'PLN', status: 'ok' },
        ],
      });

      useImportWizardStore.getState().updateRow('non-existing', { title: 'X' });

      expect(useImportWizardStore.getState().rows).toHaveLength(1);
      expect(useImportWizardStore.getState().rows[0].title).toBe('A');
    });
  });

  describe('batch edit', () => {
    it('openBatchEditPanel sets panel state', () => {
      const pendingEdit = {
        editedRowId: 'r1',
        field: 'category' as const,
        originalValue: 'Old',
        newValue: 'New',
        similarRowIds: ['r2', 'r3'],
      };

      useImportWizardStore.getState().openBatchEditPanel(pendingEdit);

      const state = useImportWizardStore.getState();
      expect(state.batchEditPanel.isOpen).toBe(true);
      expect(state.batchEditPanel.pendingEdit).toEqual(pendingEdit);
    });

    it('closeBatchEditPanel resets panel', () => {
      useImportWizardStore.setState({
        batchEditPanel: {
          isOpen: true,
          pendingEdit: {
            editedRowId: 'r1',
            field: 'category',
            originalValue: 'Old',
            newValue: 'New',
            similarRowIds: ['r2'],
          },
        },
      });

      useImportWizardStore.getState().closeBatchEditPanel();

      const state = useImportWizardStore.getState();
      expect(state.batchEditPanel.isOpen).toBe(false);
      expect(state.batchEditPanel.pendingEdit).toBeUndefined();
    });

    it('applyBatchEdit updates all similar rows with new value', () => {
      useImportWizardStore.setState({
        rows: [
          { id: 'r1', date: '2026-01-01', title: 'A', amount: -50, currency: 'PLN', status: 'ok', category: 'New' },
          { id: 'r2', date: '2026-01-02', title: 'B', amount: -30, currency: 'PLN', status: 'ok' },
          { id: 'r3', date: '2026-01-03', title: 'C', amount: -20, currency: 'PLN', status: 'ok' },
          { id: 'r4', date: '2026-01-04', title: 'D', amount: -10, currency: 'PLN', status: 'ok' },
        ],
        batchEditPanel: {
          isOpen: true,
          pendingEdit: {
            editedRowId: 'r1',
            field: 'category',
            originalValue: '',
            newValue: 'Groceries',
            similarRowIds: ['r2', 'r3'],
          },
        },
      });

      useImportWizardStore.getState().applyBatchEdit();

      const state = useImportWizardStore.getState();
      expect(state.rows.find((r) => r.id === 'r2')?.category).toBe('Groceries');
      expect(state.rows.find((r) => r.id === 'r3')?.category).toBe('Groceries');
      expect(state.rows.find((r) => r.id === 'r4')?.category).toBeUndefined();
      expect(state.batchEditPanel.isOpen).toBe(false);
    });

    it('applyBatchEdit does nothing when no pending edit', () => {
      useImportWizardStore.setState({
        rows: [
          { id: 'r1', date: '2026-01-01', title: 'A', amount: -50, currency: 'PLN', status: 'ok' },
        ],
        batchEditPanel: { isOpen: false, pendingEdit: undefined },
      });

      useImportWizardStore.getState().applyBatchEdit();

      expect(useImportWizardStore.getState().rows[0].title).toBe('A');
    });
  });

  describe('reset', () => {
    it('resets all state to initial values', () => {
      useImportWizardStore.setState({
        step: 3,
        file: new File([''], 'test.csv'),
        parsedData: { headers: ['a'], rows: [{ a: '1' }], separator: ',', encoding: 'utf-8' },
        rows: [{ id: 'r1', date: '', title: '', amount: 0, currency: '', status: 'ok' }],
        columnMapping: { a: 'date' },
        isSubmitting: true,
        selectedRowIds: ['r1'],
        batchEditPanel: {
          isOpen: true,
          pendingEdit: { editedRowId: 'r1', field: 'title', originalValue: '', newValue: 'X', similarRowIds: [] },
        },
      } as never);

      useImportWizardStore.getState().reset();

      const state = useImportWizardStore.getState();
      expect(state.step).toBe(0);
      expect(state.file).toBeUndefined();
      expect(state.parsedData).toBeUndefined();
      expect(state.rows).toHaveLength(0);
      expect(state.columnMapping).toEqual({});
      expect(state.isSubmitting).toBe(false);
      expect(state.selectedRowIds).toHaveLength(0);
      expect(state.batchEditPanel.isOpen).toBe(false);
    });
  });

  describe('setFile', () => {
    it('sets file and clears parseError', () => {
      useImportWizardStore.setState({ parseError: 'old error' });

      useImportWizardStore.getState().setFile(new File(['test'], 'new.csv'));

      const state = useImportWizardStore.getState();
      expect(state.file?.name).toBe('new.csv');
      expect(state.parseError).toBeUndefined();
    });
  });
});
