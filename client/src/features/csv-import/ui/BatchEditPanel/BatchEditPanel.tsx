import { useTranslation } from 'react-i18next';
import { ArrowRight, X } from 'lucide-react';

import { useBatchEditPanel } from '#features/csv-import/ui/hooks/useBatchEditPanel';
import { Button } from '#shared/ui/Button';
import { Card } from '#shared/ui/Card';

export const BatchEditPanel = (): React.JSX.Element | null => {
  const { t } = useTranslation();
  const {
    isOpen,
    field,
    originalValue,
    newValue,
    similarRows,
    handleApply,
    handleSkip,
  } = useBatchEditPanel();

  if (!isOpen) {
    return null;
  }

  return (
    <Card className="border-primary/30 bg-surface-2 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-foreground">
            {t('import.batchEdit.title', { count: similarRows.length })}
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('import.batchEdit.description', {
              field: t(`import.batchEdit.fields.${field}`),
            })}
          </p>

          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="rounded bg-surface px-2 py-0.5 font-mono text-muted-foreground line-through">
              {originalValue}
            </span>
            <ArrowRight size={12} className="text-muted-foreground" />
            <span className="rounded bg-primary-soft px-2 py-0.5 font-mono text-foreground">
              {newValue}
            </span>
          </div>

          <ul className="mt-3 max-h-24 space-y-1 overflow-y-auto">
            {similarRows.map((row) => (
              <li
                key={row.id}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <span className="font-mono">{row.date}</span>
                <span className="truncate">{row.title}</span>
                <span className="ml-auto font-mono tabular-nums">
                  {row.amount.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={handleSkip}
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label={t('import.batchEdit.skip')}
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button size="sm" onClick={handleApply}>
          {t('import.batchEdit.applyAll', { count: similarRows.length })}
        </Button>
        <Button size="sm" variant="secondary" onClick={handleSkip}>
          {t('import.batchEdit.skip')}
        </Button>
      </div>
    </Card>
  );
};
