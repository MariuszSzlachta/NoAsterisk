import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { DictionaryEntryViewModel, DictionaryType } from '#features/admin/model/types';

// ─── Constants ───────────────────────────────────────────────────

const DICTIONARY_TYPES: readonly DictionaryType[] = [
  'firstNames',
  'surnames',
  'cities',
  'merchants',
  'phrases',
];

const isDictionaryType = (value: string): value is DictionaryType =>
  (DICTIONARY_TYPES as readonly string[]).includes(value);

// ─── Mock Data (will be replaced by API query when backend ready) ───

const MOCK_COUNTS: Record<DictionaryType, number> = {
  firstNames: 2000,
  surnames: 5000,
  cities: 950,
  merchants: 500,
  phrases: 200,
};

// ─── Result Interface ────────────────────────────────────────────

interface DictionarySubTab {
  readonly id: DictionaryType;
  readonly label: string;
  readonly count: number;
}

interface UseDictionariesTabResult {
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

const PAGE_SIZE = 21; // 3 columns × 7 rows

// ─── Hook ────────────────────────────────────────────────────────

export const useDictionariesTab = (): UseDictionariesTabResult => {
  const { t } = useTranslation();

  const [activeType, setActiveType] = useState<DictionaryType>('firstNames');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  const subTabs: readonly DictionarySubTab[] = DICTIONARY_TYPES.map((type) => ({
    id: type,
    label: t(`admin.dictTypes.${type}`),
    count: MOCK_COUNTS[type],
  }));

  // TODO: Replace with real API query — currently mock data
  const totalEntries = MOCK_COUNTS[activeType];
  const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE));

  // Generate mock entries for current page
  const entries: readonly DictionaryEntryViewModel[] = Array.from(
    { length: Math.min(PAGE_SIZE, totalEntries - (currentPage - 1) * PAGE_SIZE) },
    (_, i) => {
      const index = (currentPage - 1) * PAGE_SIZE + i;
      return {
        id: `${activeType}-${index}`,
        value: `Entry ${index + 1}`,
        createdAt: '2026-08-20',
      };
    },
  );

  const rangeStart = (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = rangeStart + entries.length - 1;
  const displayRange = `${rangeStart}–${rangeEnd}`;

  const handleSubTabChange = (id: string): void => {
    if (!isDictionaryType(id)) {
      return;
    }
    setActiveType(id);
    setCurrentPage(1);
    setSearchQuery('');
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const handlePrevPage = (): void => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = (): void => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleOpenAdd = (): void => { setShowAddModal(true); };
  const handleCloseAdd = (): void => { setShowAddModal(false); };
  const handleOpenBulk = (): void => { setShowBulkModal(true); };
  const handleCloseBulk = (): void => { setShowBulkModal(false); };

  return {
    subTabs,
    activeType,
    entries,
    totalEntries,
    displayRange,
    searchQuery,
    currentPage,
    totalPages,
    showAddModal,
    showBulkModal,
    handleSubTabChange,
    handleSearchChange,
    handlePrevPage,
    handleNextPage,
    handleOpenAdd,
    handleCloseAdd,
    handleOpenBulk,
    handleCloseBulk,
  };
};
