import { useTranslation } from 'react-i18next';

import type { DictionaryEntryViewModel } from '#features/admin/model/types';

// ─── Props ───────────────────────────────────────────────────────

interface DictionaryEntryCardProps {
  readonly entry: DictionaryEntryViewModel;
}

// ─── Component ───────────────────────────────────────────────────

export const DictionaryEntryCard = ({ entry }: DictionaryEntryCardProps): React.JSX.Element => {
  const { t: _t } = useTranslation();

  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2">
      <div className="flex items-center gap-3">
        <span className="text-sm text-foreground">{entry.value}</span>
        <span className="font-mono text-xs text-muted-foreground">{entry.createdAt}</span>
      </div>
    </div>
  );
};
