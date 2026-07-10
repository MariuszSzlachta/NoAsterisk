import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import type { AnonymizationEntry, AnonymizationStatus } from '#features/csv-import/model/types';
import { useImportWizardStore } from '#features/csv-import/store/useImportWizardStore';

// ─── Types ───────────────────────────────────────────────────────

export type StatusFilter = 'all' | AnonymizationStatus;

export interface AnonymizationStats {
  readonly totalScanned: number;
  readonly anonymizedCount: number;
  readonly needsReviewCount: number;
  readonly safeCount: number;
}

export interface AnonymizationStepResult {
  readonly entries: readonly AnonymizationEntry[];
  readonly filteredEntries: readonly AnonymizationEntry[];
  readonly stats: AnonymizationStats;
  readonly activeFilter: StatusFilter;
  readonly selectedRowIndex: number | undefined;
  readonly selectedEntry: AnonymizationEntry | undefined;
  readonly isEditing: boolean;
  readonly editValue: string;
  readonly handleFilterChange: (filter: string) => void;
  readonly handleSelectRow: (rowIndex: number) => void;
  readonly handleClosePopover: () => void;
  readonly handleBulkAccept: () => void;
  readonly handleRestore: (rowIndex: number) => void;
  readonly handleEdit: (rowIndex: number, newTitle: string) => void;
  readonly handleRestoreSelected: () => void;
  readonly handleStartEdit: () => void;
  readonly handleEditValueChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly handleEditSave: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useAnonymizationStep = (): AnonymizationStepResult => {
  const { entries, rows, setAnonymizationEntries, setRows } = useImportWizardStore(
    useShallow((s) => ({
      entries: s.anonymizationEntries,
      rows: s.rows,
      setAnonymizationEntries: s.setAnonymizationEntries,
      setRows: s.setRows,
    })),
  );

  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  // ─── Derived: Stats (single-pass reduce) ─────────────────────

  const stats = entries.reduce<AnonymizationStats>(
    (acc, e) => ({
      totalScanned: acc.totalScanned,
      anonymizedCount: acc.anonymizedCount + (e.status === 'anonymized' ? 1 : 0),
      needsReviewCount: acc.needsReviewCount + (e.status === 'needs_review' ? 1 : 0),
      safeCount: acc.safeCount + (e.status === 'safe' ? 1 : 0),
    }),
    { totalScanned: entries.length, anonymizedCount: 0, needsReviewCount: 0, safeCount: 0 },
  );

  // ─── Derived: Filtered Entries ───────────────────────────────

  const filteredEntries =
    activeFilter === 'all'
      ? entries
      : entries.filter((e) => e.status === activeFilter);

  // ─── Derived: Selected Entry ─────────────────────────────────

  const selectedEntry = selectedRowIndex !== undefined
    ? entries.find((e) => e.rowIndex === selectedRowIndex)
    : undefined;

  // ─── Popover State Reset ─────────────────────────────────────

  const resetPopoverState = (): void => {
    setSelectedRowIndex(undefined);
    setIsEditing(false);
    setEditValue('');
  };

  // ─── Handlers ────────────────────────────────────────────────

  const isValidFilter = (value: string): value is StatusFilter =>
    value === 'all' || value === 'safe' || value === 'needs_review' || value === 'anonymized';

  const handleFilterChange = (filter: string): void => {
    if (isValidFilter(filter)) {
      setActiveFilter(filter);
    }
  };

  const handleSelectRow = (rowIndex: number): void => {
    setSelectedRowIndex(rowIndex);
  };

  const handleClosePopover = (): void => {
    resetPopoverState();
  };

  const handleBulkAccept = (): void => {
    const updated = entries.map((entry) => ({
      ...entry,
      accepted: true,
    }));
    setAnonymizationEntries(updated);
  };

  // INVARIANT: rowIndex is positional — rows array must not be reordered before this step.
  // The pipeline creates entries with sequential indices matching the rows array order.

  const handleRestore = (rowIndex: number): void => {
    const entry = entries.find((e) => e.rowIndex === rowIndex);
    if (!entry) {
      return;
    }

    const updatedEntries = entries.map((e) => {
      if (e.rowIndex !== rowIndex) {
        return e;
      }
      return {
        ...e,
        anonymizedTitle: e.originalTitle,
        spans: [] as const,
        status: 'safe' as const,
        accepted: true,
      };
    });

    const updatedRows = rows.map((row, idx) => {
      if (idx !== rowIndex) {
        return row;
      }
      return { ...row, title: entry.originalTitle };
    });

    setAnonymizationEntries(updatedEntries);
    setRows(updatedRows);
    resetPopoverState();
  };

  const handleEdit = (rowIndex: number, newTitle: string): void => {
    const updatedEntries = entries.map((entry) => {
      if (entry.rowIndex !== rowIndex) {
        return entry;
      }
      return {
        ...entry,
        anonymizedTitle: newTitle,
        accepted: true,
      };
    });

    const updatedRows = rows.map((row, idx) => {
      if (idx !== rowIndex) {
        return row;
      }
      return { ...row, title: newTitle };
    });

    setAnonymizationEntries(updatedEntries);
    setRows(updatedRows);
    resetPopoverState();
  };

  const handleRestoreSelected = (): void => {
    if (selectedRowIndex !== undefined) {
      handleRestore(selectedRowIndex);
    }
  };

  const handleStartEdit = (): void => {
    if (selectedEntry) {
      setEditValue(selectedEntry.anonymizedTitle);
      setIsEditing(true);
    }
  };

  const handleEditValueChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setEditValue(e.target.value);
  };

  const handleEditSave = (): void => {
    if (selectedRowIndex !== undefined && editValue.trim().length > 0) {
      handleEdit(selectedRowIndex, editValue.trim());
    }
  };

  return {
    entries,
    filteredEntries,
    stats,
    activeFilter,
    selectedRowIndex,
    selectedEntry,
    isEditing,
    editValue,
    handleFilterChange,
    handleSelectRow,
    handleClosePopover,
    handleBulkAccept,
    handleRestore,
    handleEdit,
    handleRestoreSelected,
    handleStartEdit,
    handleEditValueChange,
    handleEditSave,
  };
};
