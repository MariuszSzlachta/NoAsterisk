import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { AnonymizationEntry, AnonymizationStatus } from '#features/csv-import/model/types';
import { Button } from '#shared/ui/Button';

// ─── Constants ───────────────────────────────────────────────────

const STATUS_DOT_COLORS: Record<AnonymizationStatus, string> = {
  safe: 'bg-income',
  needs_review: 'bg-warning',
  anonymized: 'bg-expense',
};

const STATUS_LABELS: Record<AnonymizationStatus, string> = {
  safe: 'import.anonymization.legend.safe',
  needs_review: 'import.anonymization.legend.needsReview',
  anonymized: 'import.anonymization.legend.anonymized',
};

// ─── Props ───────────────────────────────────────────────────────

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

// ─── Component ───────────────────────────────────────────────────

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

  // Escape key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-background/60"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-xl border border-border bg-surface p-5 shadow-card">
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
              <Button variant="secondary" onClick={onRestore}>
                {t('import.anonymization.popover.restore')}
              </Button>
              <Button onClick={onStartEdit}>
                {t('import.anonymization.popover.edit')}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
