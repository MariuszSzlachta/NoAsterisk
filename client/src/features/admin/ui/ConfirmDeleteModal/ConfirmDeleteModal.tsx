import { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { Button } from '#shared/ui/Button';

// ─── Props ───────────────────────────────────────────────────────

interface ConfirmDeleteModalProps {
  readonly title: string;
  readonly description: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

// ─── Component ───────────────────────────────────────────────────

export const ConfirmDeleteModal = ({
  title,
  description,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps): React.JSX.Element => {
  const { t } = useTranslation();
  const uniqueId = useId();
  const titleId = `${uniqueId}-title`;
  const descId = `${uniqueId}-desc`;
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Capture previously focused element for restore on close
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
  }, []);

  // Auto-focus the dialog on mount
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  // Restore focus on unmount
  useEffect(() => {
    return () => {
      previousFocusRef.current?.focus();
    };
  }, []);

  // Focus trap: keep Tab/Shift+Tab within dialog
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>): void => {
      if (event.key === 'Escape') {
        onCancel();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusableElements = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      if (focusableElements.length === 0) return;

      const firstFocusable = focusableElements[0]!;
      const lastFocusable = focusableElements[focusableElements.length - 1]!;

      if (event.shiftKey && document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      } else if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    },
    [onCancel],
  );

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (event.target === event.currentTarget) {
      onCancel();
    }
  };

  const dialog = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
      aria-hidden="true"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-card outline-none"
      >
        <h2 id={titleId} className="text-base font-semibold text-foreground">
          {title}
        </h2>
        <p id={descId} className="mt-2 text-sm text-muted-foreground">
          {description}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            {t('admin.modal.cancel')}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {t('admin.modal.delete')}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
};
