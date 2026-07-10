import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import type { AnonymizationEntry } from '#features/csv-import/model/types';
import { useImportWizardStore } from '#features/csv-import/store/useImportWizardStore';

import { useAnonymizationStep } from './useAnonymizationStep';

// ─── Test Data ───────────────────────────────────────────────────

const buildEntry = (overrides: Partial<AnonymizationEntry> = {}): AnonymizationEntry => ({
  rowIndex: 0,
  originalTitle: 'PRZELEW Jan Kowalski 51 2400 0005 0000 4000 1234 5678',
  anonymizedTitle: 'PRZELEW •••• 5678 Jan ███',
  spans: [
    { start: 8, end: 21, type: 'name', confidence: 0.92, original: 'Jan Kowalski', detectorId: 'name' },
    { start: 22, end: 52, type: 'iban', confidence: 0.99, original: '51 2400 0005 0000 4000 1234 5678', detectorId: 'iban' },
  ],
  status: 'anonymized',
  accepted: true,
  ...overrides,
});

const buildEntries = (): AnonymizationEntry[] => [
  buildEntry({ rowIndex: 0, status: 'anonymized', accepted: true }),
  buildEntry({
    rowIndex: 1,
    originalTitle: 'BIEDRONKA 1234 WARSZAWA',
    anonymizedTitle: 'BIEDRONKA 1234 WARSZAWA',
    spans: [],
    status: 'safe',
    accepted: true,
  }),
  buildEntry({
    rowIndex: 2,
    originalTitle: 'PRZELEW Jan Nowak',
    anonymizedTitle: 'PRZELEW Jan ███',
    spans: [{ start: 12, end: 17, type: 'name', confidence: 0.75, original: 'Nowak', detectorId: 'name' }],
    status: 'needs_review',
    accepted: false,
  }),
  buildEntry({
    rowIndex: 3,
    originalTitle: 'SPOTIFY PREMIUM',
    anonymizedTitle: 'SPOTIFY PREMIUM',
    spans: [],
    status: 'safe',
    accepted: true,
  }),
];

const buildRows = () => [
  { id: 'r0', date: '2026-06-26', title: 'PRZELEW •••• 5678 Jan ███', amount: -1200, currency: 'PLN', status: 'ok' as const },
  { id: 'r1', date: '2026-06-26', title: 'BIEDRONKA 1234 WARSZAWA', amount: -87.43, currency: 'PLN', status: 'ok' as const },
  { id: 'r2', date: '2026-06-25', title: 'PRZELEW Jan ███', amount: -50, currency: 'PLN', status: 'ok' as const },
  { id: 'r3', date: '2026-06-25', title: 'SPOTIFY PREMIUM', amount: -23.99, currency: 'PLN', status: 'ok' as const },
];

// ─── Tests ───────────────────────────────────────────────────────

describe('useAnonymizationStep', () => {
  beforeEach(() => {
    useImportWizardStore.setState({
      anonymizationEntries: buildEntries(),
      rows: buildRows(),
    });
  });

  describe('stats', () => {
    it('computes correct stats from entries', () => {
      const { result } = renderHook(() => useAnonymizationStep());

      expect(result.current.stats).toEqual({
        totalScanned: 4,
        anonymizedCount: 1,
        needsReviewCount: 1,
        safeCount: 2,
      });
    });
  });

  describe('filtering', () => {
    it('defaults activeFilter to all', () => {
      const { result } = renderHook(() => useAnonymizationStep());

      expect(result.current.activeFilter).toBe('all');
      expect(result.current.filteredEntries).toHaveLength(4);
    });

    it('filters entries by status when filter changes', () => {
      const { result } = renderHook(() => useAnonymizationStep());

      act(() => {
        result.current.handleFilterChange('needs_review');
      });

      expect(result.current.filteredEntries).toHaveLength(1);
      expect(result.current.filteredEntries[0]?.status).toBe('needs_review');
    });

    it('shows only safe entries when safe filter active', () => {
      const { result } = renderHook(() => useAnonymizationStep());

      act(() => {
        result.current.handleFilterChange('safe');
      });

      expect(result.current.filteredEntries).toHaveLength(2);
    });
  });

  describe('row selection / popover', () => {
    it('sets selectedRowIndex when selecting any row', () => {
      const { result } = renderHook(() => useAnonymizationStep());

      act(() => {
        result.current.handleSelectRow(0);
      });

      expect(result.current.selectedRowIndex).toBe(0);
    });

    it('allows selecting safe rows for editing', () => {
      const { result } = renderHook(() => useAnonymizationStep());

      act(() => {
        result.current.handleSelectRow(1);
      });

      expect(result.current.selectedRowIndex).toBe(1);
      expect(result.current.selectedEntry?.status).toBe('safe');
    });

    it('clears selectedRowIndex on close', () => {
      const { result } = renderHook(() => useAnonymizationStep());

      act(() => {
        result.current.handleSelectRow(0);
      });
      act(() => {
        result.current.handleClosePopover();
      });

      expect(result.current.selectedRowIndex).toBeUndefined();
    });
  });

  describe('bulk accept', () => {
    it('marks all entries as accepted', () => {
      const { result } = renderHook(() => useAnonymizationStep());

      act(() => {
        result.current.handleBulkAccept();
      });

      const storeEntries = useImportWizardStore.getState().anonymizationEntries;
      expect(storeEntries.every((e) => e.accepted)).toBe(true);
    });
  });

  describe('restore', () => {
    it('restores original title and sets status to safe', () => {
      const { result } = renderHook(() => useAnonymizationStep());

      act(() => {
        result.current.handleRestore(0);
      });

      const storeEntries = useImportWizardStore.getState().anonymizationEntries;
      const restored = storeEntries.find((e) => e.rowIndex === 0);
      expect(restored?.anonymizedTitle).toBe('PRZELEW Jan Kowalski 51 2400 0005 0000 4000 1234 5678');
      expect(restored?.status).toBe('safe');
      expect(restored?.spans).toHaveLength(0);
      expect(restored?.accepted).toBe(true);
    });

    it('updates row title back to original', () => {
      const { result } = renderHook(() => useAnonymizationStep());

      act(() => {
        result.current.handleRestore(0);
      });

      const storeRows = useImportWizardStore.getState().rows;
      expect(storeRows[0]?.title).toBe('PRZELEW Jan Kowalski 51 2400 0005 0000 4000 1234 5678');
    });

    it('closes popover after restore', () => {
      const { result } = renderHook(() => useAnonymizationStep());

      act(() => {
        result.current.handleSelectRow(0);
      });
      act(() => {
        result.current.handleRestore(0);
      });

      expect(result.current.selectedRowIndex).toBeUndefined();
    });
  });

  describe('edit', () => {
    it('updates anonymizedTitle with user correction', () => {
      const { result } = renderHook(() => useAnonymizationStep());

      act(() => {
        result.current.handleEdit(2, 'PRZELEW J. N.');
      });

      const storeEntries = useImportWizardStore.getState().anonymizationEntries;
      const edited = storeEntries.find((e) => e.rowIndex === 2);
      expect(edited?.anonymizedTitle).toBe('PRZELEW J. N.');
      expect(edited?.accepted).toBe(true);
    });

    it('updates row title with user correction', () => {
      const { result } = renderHook(() => useAnonymizationStep());

      act(() => {
        result.current.handleEdit(2, 'PRZELEW J. N.');
      });

      const storeRows = useImportWizardStore.getState().rows;
      expect(storeRows[2]?.title).toBe('PRZELEW J. N.');
    });

    it('closes popover after edit', () => {
      const { result } = renderHook(() => useAnonymizationStep());

      act(() => {
        result.current.handleSelectRow(2);
      });
      act(() => {
        result.current.handleEdit(2, 'PRZELEW J. N.');
      });

      expect(result.current.selectedRowIndex).toBeUndefined();
    });

    it('preserves entry status after edit', () => {
      const { result } = renderHook(() => useAnonymizationStep());

      act(() => {
        result.current.handleEdit(2, 'PRZELEW J. N.');
      });

      const storeEntries = useImportWizardStore.getState().anonymizationEntries;
      const edited = storeEntries.find((e) => e.rowIndex === 2);
      expect(edited?.status).toBe('needs_review');
    });

    it('allows editing safe rows', () => {
      const { result } = renderHook(() => useAnonymizationStep());

      act(() => {
        result.current.handleEdit(1, 'BIEDRONKA EDITED');
      });

      const storeEntries = useImportWizardStore.getState().anonymizationEntries;
      const edited = storeEntries.find((e) => e.rowIndex === 1);
      expect(edited?.anonymizedTitle).toBe('BIEDRONKA EDITED');

      const storeRows = useImportWizardStore.getState().rows;
      expect(storeRows[1]?.title).toBe('BIEDRONKA EDITED');
    });
  });
});
