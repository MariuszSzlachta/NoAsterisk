import { useEffect } from 'react';
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('keydown', handleKeyDown); };
  }, [onCancel]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (event.target === event.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-card">
        <h2 id="confirm-delete-title" className="text-base font-semibold text-foreground">
          {title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
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
};
