import type { DictionaryEntryViewModel } from '#features/admin/model/types/dictionary-entry-view-model';
import type { DictionaryType } from '#features/admin/model/types/dictionary-type';
import type { DictionarySubTab } from '#features/admin/ui/hooks/useDictionariesTab/dictionary-sub-tab';

export interface UseDictionariesTabResult {
  readonly subTabs: readonly DictionarySubTab[];
  readonly activeType: DictionaryType;
  readonly entries: readonly DictionaryEntryViewModel[];
  readonly totalEntries: number;
  readonly displayRange: string;
  readonly searchQuery: string;
  readonly currentPage: number;
  readonly totalPages: number;
  readonly showAddModal: boolean;
  readonly showBulkModal: boolean;
  readonly handleSubTabChange: (id: string) => void;
  readonly handleSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  readonly handlePrevPage: () => void;
  readonly handleNextPage: () => void;
  readonly handleOpenAdd: () => void;
  readonly handleCloseAdd: () => void;
  readonly handleOpenBulk: () => void;
  readonly handleCloseBulk: () => void;
}
