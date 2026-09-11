import { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import type { ConfirmDeleteModalProps } from '#features/admin/ui/ConfirmDeleteModal/confirm-delete-modal-props';
import { Button } from '#shared/ui/Button';

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
  const previousFocusRef = useRef<Element | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement;
  }, []);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
      }
    };
  }, []);

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
      if (!dialog) {
        return;
      }

      const focusableElements = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      if (focusableElements.length === 0) {
        return;
      }

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
    [onCancel],
  );

  const handleBackdropClick = (
    event: React.MouseEvent<HTMLDivElement>,
  ): void => {
    if (event.target === event.currentTarget) {
      onCancel();
    }
  };

  const dialog = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="w-full max-w-md rounded-lg border border-border bg-surface p-5 shadow-card outline-none sm:p-6"
      >
        <h2 id={titleId} className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        <p id={descId} className="mt-2 text-base text-muted-foreground">
          {description}
        </p>
        <div className="mt-6 flex gap-3 sm:justify-end">
          <Button
            variant="secondary"
            onClick={onCancel}
            className="min-h-12 flex-1 px-4 sm:min-h-0 sm:flex-none"
          >
            {t('admin.modal.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="min-h-12 flex-1 px-4 sm:min-h-0 sm:flex-none"
          >
            {t('admin.modal.delete')}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
};
