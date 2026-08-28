import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { AnonymizationEntry } from '#features/csv-import/model/types';
import { Button } from '#shared/ui/Button';
import { STATUS_DOT_COLORS } from '#features/csv-import/ui/AnonymizationPopover/status-dot-colors';
import { STATUS_LABELS } from '#features/csv-import/ui/AnonymizationPopover/status-labels';


interface AnonymizationPopoverProps {
  readonly entry: AnonymizationEntry;
  readonly isEditing: boolean;
  readonly editValue: string;
  readonly onClose: () => void;
  readonly onRestore: () => void;
  readonly onStartEdit: () => void;
  readonly onEditValueChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly onEditSave: () => void;
}


export const AnonymizationPopover = ({
  entry,
  isEditing,
  editValue,
  onClose,
  onRestore,
  onStartEdit,
  onEditValueChange,
  onEditSave,
}: AnonymizationPopoverProps): React.JSX.Element => {
  const { t } = useTranslation();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-background/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
          aria-labelledby pozostawia użytkownika klawiatury poza modalem. Ten
          ekran pokazuje raw PII, więc przypadkowe Escape/click semantics są istotne. */}
      <div
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-5 shadow-card"
        role="dialog"
        aria-modal="true"
      >
        {/* Header: status badge + close */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-[13px] font-medium text-foreground">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_DOT_COLORS[entry.status]}`} />
            {t(STATUS_LABELS[entry.status])}
          </span>
          <button
            type="button"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Original section */}
        <div className="mt-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-subtle">
            {t('import.anonymization.popover.original')}
          </p>
          <div className="mt-1.5 rounded-md border border-border bg-surface-2 px-3 py-2">
            <p className="font-mono text-[13px] text-foreground">
              {entry.originalTitle}
            </p>
          </div>
        </div>

        {/* Anonymized section / Edit input */}
        <div className="mt-3">
          <p id="anonymized-label" className="text-[11px] font-medium uppercase tracking-wide text-subtle">
            {t('import.anonymization.popover.anonymized')}
          </p>
          {isEditing ? (
               być jedyną granicą bezpieczeństwa. */
            <input
              type="text"
              className="mt-1.5 w-full rounded-md border border-primary bg-surface-2 px-3 py-2 font-mono text-[13px] text-foreground outline-none ring-1 ring-primary/30"
              value={editValue}
              onChange={onEditValueChange}
              aria-labelledby="anonymized-label"
              autoFocus
            />
          ) : (
            <div className="mt-1.5 rounded-md border border-border bg-surface-2 px-3 py-2">
              <p className="font-mono text-[13px] text-foreground">
                {entry.anonymizedTitle}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-5 flex justify-end gap-2">
          {isEditing ? (
            <Button onClick={onEditSave}>
              {t('import.anonymization.popover.save')}
            </Button>
          ) : (
            <>
              {entry.status !== 'safe' && (
                <Button variant="secondary" onClick={onRestore}>
                  {t('import.anonymization.popover.restore')}
                </Button>
              )}
              <Button onClick={onStartEdit}>
                {t('import.anonymization.popover.edit')}
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
};
