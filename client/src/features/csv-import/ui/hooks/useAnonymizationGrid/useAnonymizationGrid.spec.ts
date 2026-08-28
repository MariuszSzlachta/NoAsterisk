import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  AnonymizationEntry,
  ColumnMapping,
  TransactionRow,
} from '#features/csv-import/model/types';
import { useImportWizardStore } from '#features/csv-import/store/useImportWizardStore';

import { useAnonymizationGrid } from './useAnonymizationGrid';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// ─── Test Data ───────────────────────────────────────────────────

const buildMapping = (): ColumnMapping => ({
  '#Data operacji': 'date',
  '#Opis operacji': 'title',
  '#Kwota': 'amount',
  '#Waluta': 'currency',
});

const buildRows = (): Pick<
  TransactionRow,
  'id' | 'date' | 'title' | 'amount' | 'currency' | 'status'
>[] => [
  {
    id: 'r0',
    date: '2026-06-26',
    title: 'BIEDRONKA 1234',
    amount: -87.43,
    currency: 'PLN',
    status: 'ok',
  },
  {
    id: 'r1',
    date: '2026-06-25',
    title: 'PRZELEW •••• 5678',
    amount: -1200,
    currency: 'PLN',
    status: 'ok',
  },
];

const buildEntries = (): AnonymizationEntry[] => [
  {
    rowIndex: 0,
    originalTitle: 'BIEDRONKA 1234',
    anonymizedTitle: 'BIEDRONKA 1234',
    spans: [],
    status: 'safe',
    accepted: true,
  },
  {
    rowIndex: 1,
    originalTitle: 'PRZELEW Jan Kowalski 51 2400 0005 0000',
    anonymizedTitle: 'PRZELEW •••• 5678',
    spans: [
      {
        start: 8,
        end: 21,
        type: 'name',
        confidence: 0.95,
        original: 'Jan Kowalski',
        detectorId: 'name',
      },
    ],
    status: 'anonymized',
    accepted: true,
  },
];

// ─── Tests ───────────────────────────────────────────────────────

describe('useAnonymizationGrid', () => {
  beforeEach(() => {
    useImportWizardStore.setState({
      columnMapping: buildMapping(),
      rows: buildRows(),
      anonymizationEntries: buildEntries(),
    });
  });

  describe('columns', () => {
    it('builds columns from columnMapping in order', () => {
      const { result } = renderHook(() => useAnonymizationGrid());

      expect(result.current.columns).toHaveLength(4);
      expect(result.current.columns[0]?.field).toBe('date');
      expect(result.current.columns[1]?.field).toBe('title');
      expect(result.current.columns[2]?.field).toBe('amount');
      expect(result.current.columns[3]?.field).toBe('currency');
    });

    it('assigns i18n keys as header names', () => {
      const { result } = renderHook(() => useAnonymizationGrid());

      expect(result.current.columns[0]?.headerName).toBe('import.grid.date');
      expect(result.current.columns[1]?.headerName).toBe('import.grid.title');
      expect(result.current.columns[2]?.headerName).toBe('import.grid.amount');
    });

    it('applies fixed width to date and amount columns', () => {
      const { result } = renderHook(() => useAnonymizationGrid());

      expect(result.current.columns[0]?.width).toBe(100);
      expect(result.current.columns[2]?.width).toBe(120);
    });

    it('applies flex to title column', () => {
      const { result } = renderHook(() => useAnonymizationGrid());

      expect(result.current.columns[1]?.flex).toBe(1);
    });

    it('skips debit/credit fields (no grid equivalent)', () => {
      useImportWizardStore.setState({
        columnMapping: {
          'Kwota Wn': 'debit',
          'Kwota Ma': 'credit',
          '#Data': 'date',
        },
      });

      const { result } = renderHook(() => useAnonymizationGrid());

      expect(result.current.columns).toHaveLength(1);
      expect(result.current.columns[0]?.field).toBe('date');
    });

    it('deduplicates fields mapped from multiple CSV columns', () => {
      useImportWizardStore.setState({
        columnMapping: { 'Col A': 'date', 'Col B': 'date', 'Col C': 'title' },
      });

      const { result } = renderHook(() => useAnonymizationGrid());

      expect(result.current.columns).toHaveLength(2);
    });
  });

  describe('rows', () => {
    it('builds grid rows from store rows + entries', () => {
      const { result } = renderHook(() => useAnonymizationGrid());

      expect(result.current.rows).toHaveLength(2);
    });

    it('uses anonymizedTitle from entry for title field', () => {
      const { result } = renderHook(() => useAnonymizationGrid());

      expect(result.current.rows[1]?.title).toBe('PRZELEW •••• 5678');
    });

    it('includes anonymizationStatus from entry', () => {
      const { result } = renderHook(() => useAnonymizationGrid());

      expect(result.current.rows[0]?.anonymizationStatus).toBe('safe');
      expect(result.current.rows[1]?.anonymizationStatus).toBe('anonymized');
    });

    it('includes rowIndex for cell click lookup', () => {
      const { result } = renderHook(() => useAnonymizationGrid());

      expect(result.current.rows[0]?.rowIndex).toBe(0);
      expect(result.current.rows[1]?.rowIndex).toBe(1);
    });
  });

  describe('getRowId', () => {
    it('returns row id', () => {
      const { result } = renderHook(() => useAnonymizationGrid());

      const row = result.current.rows[0];
      expect(row).toBeDefined();
      expect(result.current.getRowId(row!)).toBe('r0');
    });
  });

  describe('statusFilter', () => {
    it('shows all rows when filter is undefined', () => {
      const { result } = renderHook(() =>
        useAnonymizationGrid(undefined, undefined),
      );

      expect(result.current.rows).toHaveLength(2);
    });

    it('shows all rows when filter is "all"', () => {
      const { result } = renderHook(() =>
        useAnonymizationGrid(undefined, 'all'),
      );

      expect(result.current.rows).toHaveLength(2);
    });

    it('filters to only safe rows', () => {
      const { result } = renderHook(() =>
        useAnonymizationGrid(undefined, 'safe'),
      );

      expect(result.current.rows).toHaveLength(1);
      expect(result.current.rows[0]?.anonymizationStatus).toBe('safe');
    });

    it('filters to only anonymized rows', () => {
      const { result } = renderHook(() =>
        useAnonymizationGrid(undefined, 'anonymized'),
      );

      expect(result.current.rows).toHaveLength(1);
      expect(result.current.rows[0]?.anonymizationStatus).toBe('anonymized');
    });

    it('returns empty array when no rows match filter', () => {
      const { result } = renderHook(() =>
        useAnonymizationGrid(undefined, 'needs_review'),
      );

      expect(result.current.rows).toHaveLength(0);
    });
  });
});
