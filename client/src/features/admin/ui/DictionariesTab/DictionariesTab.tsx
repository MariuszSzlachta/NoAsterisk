import { Plus, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { DictionaryEntryCard } from '#features/admin/ui/DictionaryEntryCard';
import { useDictionariesTab } from '#features/admin/ui/hooks/useDictionariesTab';
import { Button } from '#shared/ui/Button';
import { FilterTabs } from '#shared/ui/FilterTabs';
import { Input } from '#shared/ui/Input';


export const DictionariesTab = (): React.JSX.Element => {
  const { t } = useTranslation();
  const {
    subTabs,
    activeType,
    entries,
    totalEntries,
    displayRange,
    searchQuery,
    currentPage,
    totalPages,
    handleSubTabChange,
    handleSearchChange,
    handlePrevPage,
    handleNextPage,
    handleOpenAdd,
    handleOpenBulk,
  } = useDictionariesTab();

  const tabs = subTabs.map((st) => ({ id: st.id, label: st.label, count: st.count }));

  return (
    <div className="flex flex-col gap-4">
      <FilterTabs tabs={tabs} activeTab={activeType} onTabChange={handleSubTabChange} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {t(`admin.dictTypes.${activeType}`)}
          </span>
          <span className="text-xs text-muted-foreground">
            {totalEntries.toLocaleString()} {t('admin.dict.entries')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder={t('admin.dict.searchPlaceholder')}
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-48"
          />
          <Button icon={<Plus size={14} />} onClick={handleOpenAdd}>
            {t('admin.dict.addEntry')}
          </Button>
          <Button variant="secondary" icon={<Upload size={14} />} onClick={handleOpenBulk}>
            {t('admin.dict.bulkImport')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <DictionaryEntryCard key={entry.id} entry={entry} />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {displayRange} {t('admin.dict.of')} {totalEntries.toLocaleString()} {t('admin.dict.entries')}
        </span>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" disabled={currentPage <= 1} onClick={handlePrevPage}>
            ←
          </Button>
          <Button variant="ghost" size="sm" disabled={currentPage >= totalPages} onClick={handleNextPage}>
            →
          </Button>
        </div>
      </div>
    </div>
  );
};
