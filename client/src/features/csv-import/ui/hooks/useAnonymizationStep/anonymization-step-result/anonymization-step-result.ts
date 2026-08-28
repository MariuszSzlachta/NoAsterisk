import type { AnonymizationEntry } from '#features/csv-import/model/types';
import type { AnonymizationStats } from '#features/csv-import/ui/hooks/useAnonymizationStep/anonymization-stats';
import type { StatusFilter } from '#features/csv-import/ui/hooks/useAnonymizationStep/status-filter';

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
