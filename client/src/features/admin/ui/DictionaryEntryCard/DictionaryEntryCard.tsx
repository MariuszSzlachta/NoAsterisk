import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { DictionaryEntryViewModel } from '#features/admin';
import { Button } from '#shared/ui/Button';

// ─── Props ───────────────────────────────────────────────────────

interface DictionaryEntryCardProps {
  readonly entry: DictionaryEntryViewModel;
  readonly onDelete: (entryId: string) => void;
}

// ─── Component ───────────────────────────────────────────────────

export const DictionaryEntryCard = ({ entry, onDelete }: DictionaryEntryCardProps): React.JSX.Element => {
  const { t } = useTranslation();

  const handleDelete = (): void => {
    onDelete(entry.id);
  };

  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2">
      <div className="flex items-center gap-3">
        <span className="text-sm text-foreground">{entry.value}</span>
        <span className="font-mono text-xs text-muted-foreground">{entry.createdAt}</span>
      </div>
      <Button variant="ghost" size="icon" onClick={handleDelete} aria-label={t('admin.dict.deleteEntry')}>
        <Trash2 size={12} className="text-expense" />
      </Button>
    </div>
  );
};
