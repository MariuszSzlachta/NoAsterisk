import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';

export const SearchButton = (): React.JSX.Element => {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      aria-label={t('topbar.searchLabel')}
      className="flex w-[230px] items-center gap-2 rounded-md border border-border bg-surface px-[11px] py-2"
    >
      <Search size={15} className="text-subtle" aria-hidden="true" />
      <span className="text-[13px] text-subtle">{t('topbar.search')}</span>
      <kbd className="ml-auto rounded-sm border border-border px-1 py-[1px] font-mono text-[10px] font-medium text-subtle">
        ⌘K
      </kbd>
    </button>
  );
};
