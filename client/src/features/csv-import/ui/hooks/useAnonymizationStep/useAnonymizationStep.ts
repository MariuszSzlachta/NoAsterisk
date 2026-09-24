import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useImportWizardStore } from '#features/csv-import/store/useImportWizardStore';

import type { AnonymizationStepResult } from '#features/csv-import/ui/hooks/useAnonymizationStep/anonymization-step-result';
import type { AnonymizationStats } from '#features/csv-import/ui/hooks/useAnonymizationStep/anonymization-stats';
import type { StatusFilter } from '#features/csv-import/ui/hooks/useAnonymizationStep/status-filter';
import type { AnonymizationEntry } from '#features/csv-import/model/anonymization/types/anonymization-entry/anonymization-entry';
import type { TransactionRow } from '#features/csv-import/model/types';


export const useAnonymizationStep = (): AnonymizationStepResult => {
  const { entries, rows, setAnonymizationEntries, setRows } =
    useImportWizardStore(
      useShallow((s) => ({
        entries: s.anonymizationEntries,
        rows: s.rows,
        setAnonymizationEntries: s.setAnonymizationEntries,
        setRows: s.setRows,
      })),
    );

  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | undefined>(
    undefined,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');


  const stats = entries.reduce<AnonymizationStats>(
    (acc, e) => ({
      totalScanned: acc.totalScanned,
      anonymizedCount:
        acc.anonymizedCount + (e.status === 'anonymized' ? 1 : 0),
      needsReviewCount:
        acc.needsReviewCount + (e.status === 'needs_review' ? 1 : 0),
      safeCount: acc.safeCount + (e.status === 'safe' ? 1 : 0),
    }),
    {
      totalScanned: entries.length,
      anonymizedCount: 0,
      needsReviewCount: 0,
      safeCount: 0,
    },
  );


  const filteredEntries =
    activeFilter === 'all'
      ? entries
      : entries.filter((e) => e.status === activeFilter);


  const selectedEntry =
    selectedRowIndex !== undefined
      ? entries.find((e) => e.rowIndex === selectedRowIndex)
      : undefined;


  const resetPopoverState = (): void => {
    setSelectedRowIndex(undefined);
    setIsEditing(false);
    setEditValue('');
  };


  const isValidFilter = (value: string): value is StatusFilter =>
    value === 'all' ||
    value === 'safe' ||
    value === 'needs_review' ||
    value === 'anonymized';

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

    const updatedEntries: AnonymizationEntry[] = entries.map((e) => {
      if (e.rowIndex !== rowIndex) {
        return e;
      }
      return {
        ...e,
        anonymizedTitle: e.originalTitle,
        spans: [],
        status: 'safe',
        accepted: true,
      };
    });

    const updatedRows: TransactionRow[] = rows.map((row, idx) => {
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
    const updatedEntries: AnonymizationEntry[] = entries.map((entry) => {
      if (entry.rowIndex !== rowIndex) {
        return entry;
      }
      return {
        ...entry,
        anonymizedTitle: newTitle,
        accepted: true,
      };
    });

    const updatedRows: TransactionRow[] = rows.map((row, idx) => {
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

  const handleEditValueChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
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
