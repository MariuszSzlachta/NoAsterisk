import { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';

import type { ImportHistoryDeleteDialogProps } from '#features/csv-import/ui/ImportHistoryDeleteDialog/types';
import { Button } from '#shared/ui/Button';

export const ImportHistoryDeleteDialog = ({
  record,
  isDeleting,
  onCancel,
  onConfirm,
}: ImportHistoryDeleteDialogProps): React.JSX.Element => {
  const { t } = useTranslation();
  const uniqueId = useId();
  const titleId = `${uniqueId}-title`;
  const descriptionId = `${uniqueId}-description`;
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    dialogRef.current?.focus();

    return () => {
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
      }
    };
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>): void => {
      if (event.key === 'Escape') {
        if (!isDeleting) {
          onCancel();
        }
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const dialog = dialogRef.current;
      if (!dialog) {
        return;
      }

      const focusableElements = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      if (!firstFocusable || !lastFocusable) {
        return;
      }

      if (event.shiftKey && document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      }

      if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    },
    [isDeleting, onCancel],
  );

  const handleBackdropClick = (
    event: React.MouseEvent<HTMLDivElement>,
  ): void => {
    if (event.target === event.currentTarget && !isDeleting) {
      onCancel();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="relative flex w-full max-w-[440px] flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-expense-soft">
          <AlertTriangle
            size={20}
            className="text-expense"
            aria-hidden="true"
          />
        </div>
        <div className="flex flex-col gap-1">
          <h2 id={titleId} className="text-base font-semibold text-foreground">
            {t('importHistory.deleteDialog.title')}
          </h2>
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {t('importHistory.deleteDialog.description', {
              fileName: record.fileName,
            })}
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onCancel} disabled={isDeleting}>
            {t('importHistory.deleteDialog.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting
              ? t('importHistory.deleteDialog.deleting')
              : t('importHistory.deleteDialog.confirm')}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
