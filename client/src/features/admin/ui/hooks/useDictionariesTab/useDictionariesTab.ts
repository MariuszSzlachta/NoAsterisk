import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { DictionaryEntryViewModel } from '#features/admin/model/types/dictionary-entry-view-model';
import type { DictionaryType } from '#features/admin/model/types/dictionary-type';

import { DICTIONARY_TYPES } from '#features/admin/ui/hooks/useDictionariesTab/constants/dictionary-types';
import { MOCK_COUNTS } from '#features/admin/ui/hooks/useDictionariesTab/constants/mock-counts';
import { PAGE_SIZE } from '#features/admin/ui/hooks/useDictionariesTab/constants/page-size';
import { isDictionaryType } from '#features/admin/ui/hooks/useDictionariesTab/is-dictionary-type';
import type { UseDictionariesTabResult } from '#features/admin/ui/hooks/useDictionariesTab/use-dictionaries-tab-result';

export const useDictionariesTab = (): UseDictionariesTabResult => {
  const { t } = useTranslation();

  const [activeType, setActiveType] = useState<DictionaryType>('firstNames');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  const subTabs = DICTIONARY_TYPES.map((type) => ({
    id: type,
    label: t(`admin.dictTypes.${type}`),
    count: MOCK_COUNTS[type],
  }));

  const totalEntries = MOCK_COUNTS[activeType];
  const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE));

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
