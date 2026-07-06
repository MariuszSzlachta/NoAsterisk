import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useImportWizardStore } from '#features/csv-import/store/useImportWizardStore';

import { useColumnMappingStep } from './useColumnMappingStep';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const buildParsedData = () => ({
  headers: ['date', 'title', 'amount'],
  rows: [
    { date: '2026-01-01', title: 'Grocery Store', amount: '-50.00' },
    { date: '2026-01-02', title: 'Salary', amount: '8500.00' },
    { date: '2026-01-03', title: 'Netflix', amount: '-49.99' },
  ],
  separator: ',',
  encoding: 'utf-8',
  fileName: 'test.csv',
  rowCount: 3,
});

describe('useColumnMappingStep', () => {
  describe('row selection', () => {
    it('defaults selectedPreviewRowIndex to 0', () => {
      useImportWizardStore.setState({ parsedData: buildParsedData() });

      const { result } = renderHook(() => useColumnMappingStep());

      expect(result.current.selectedPreviewRowIndex).toBe(0);
    });

    it('returns example value from first row by default', () => {
      useImportWizardStore.setState({ parsedData: buildParsedData() });

      const { result } = renderHook(() => useColumnMappingStep());

      expect(result.current.getExampleValue('title')).toBe('Grocery Store');
    });

    it('updates selectedPreviewRowIndex when handlePreviewRowSelect is called', () => {
      useImportWizardStore.setState({ parsedData: buildParsedData() });

      const { result } = renderHook(() => useColumnMappingStep());

      act(() => {
        result.current.handlePreviewRowSelect(2);
      });

      expect(result.current.selectedPreviewRowIndex).toBe(2);
    });

    it('returns example value from selected row after selection change', () => {
      useImportWizardStore.setState({ parsedData: buildParsedData() });

      const { result } = renderHook(() => useColumnMappingStep());

      act(() => {
        result.current.handlePreviewRowSelect(1);
      });

      expect(result.current.getExampleValue('title')).toBe('Salary');
      expect(result.current.getExampleValue('amount')).toBe('8500.00');
    });

    it('returns empty string when no parsed data is available', () => {
      useImportWizardStore.setState({ parsedData: undefined });

      const { result } = renderHook(() => useColumnMappingStep());

      expect(result.current.getExampleValue('title')).toBe('');
    });

    it('returns empty string for non-existent header', () => {
      useImportWizardStore.setState({ parsedData: buildParsedData() });

      const { result } = renderHook(() => useColumnMappingStep());

      expect(result.current.getExampleValue('nonexistent')).toBe('');
    });
  });
});
