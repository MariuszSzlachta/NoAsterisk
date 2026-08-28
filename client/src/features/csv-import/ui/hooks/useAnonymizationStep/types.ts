import type { AnonymizationEntry, AnonymizationStatus } from '#features/csv-import/model/types';

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
  readonly handleEditValueChange: (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  readonly handleEditSave: () => void;
}
