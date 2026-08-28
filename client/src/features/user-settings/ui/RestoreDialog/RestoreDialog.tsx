// User Settings — RestoreDialog Component

import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '#shared/ui/Button';
import { Input } from '#shared/ui/Input';
import type { RestoreDialogProps } from '#features/user-settings/ui/RestoreDialog/restore-dialog-props';

export const RestoreDialog = ({
  backupDate,
  isLoading = false,
  error,
  onRestore,
  onCancel,
}: RestoreDialogProps): React.JSX.Element => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    dialogRef.current?.focus();
    return () => { document.removeEventListener('keydown', handleKeyDown); };
  }, [onCancel, isLoading]);

  const isValid = password.length >= 1;

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (isValid) {
      onRestore(password);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={isLoading ? undefined : onCancel}
        role="presentation"
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative mx-4 w-full max-w-[440px] rounded-xl border border-border bg-surface p-6 shadow-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="restore-dialog-title"
      >
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft">
          <RotateCcw size={20} className="text-primary" aria-hidden="true" />
        </div>

        <h2 id="restore-dialog-title" className="mb-1 text-base font-semibold text-foreground">
          {t('settings.restoreDialog.title')}
        </h2>
        <p className="mb-1 text-sm text-muted-foreground">
          {t('settings.restoreDialog.backupDate', { date: backupDate })}
        </p>
        <p className="mb-4 text-sm text-muted-foreground">
          {t('settings.restoreDialog.description')}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Input
              label={t('settings.restoreDialog.passwordLabel')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('settings.restoreDialog.passwordPlaceholder')}
            />
          </div>

          {error && (
            <p className="mb-3 text-xs text-expense" role="alert">{error}</p>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" type="button" onClick={onCancel} disabled={isLoading}>
              {t('settings.restoreDialog.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isLoading}
            >
              {isLoading ? t('settings.vault.passwordDialog.processing') : t('settings.restoreDialog.confirm')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
