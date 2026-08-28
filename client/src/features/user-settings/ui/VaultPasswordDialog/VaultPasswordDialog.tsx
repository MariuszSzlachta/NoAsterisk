// User Settings — VaultPasswordDialog Component

import { useEffect, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '#shared/ui/Button';
import { Input } from '#shared/ui/Input';
import type { VaultPasswordDialogProps } from '#features/user-settings/ui/VaultPasswordDialog/vault-password-dialog-props';

import type { VaultPasswordMode } from '#features/user-settings/ui/VaultPasswordDialog/vault-password-mode';

export const VaultPasswordDialog = ({
  mode,
  error,
  isLoading,
  onSubmit,
  onCancel,
}: VaultPasswordDialogProps): React.JSX.Element => {
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

  const handleFormSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (password.length > 0) {
      onSubmit(password);
    }
  };

  const title = mode === 'encrypt'
    ? t('settings.vault.passwordDialog.encryptTitle')
    : t('settings.vault.passwordDialog.decryptTitle');

  const description = mode === 'encrypt'
    ? t('settings.vault.passwordDialog.encryptDescription')
    : t('settings.vault.passwordDialog.decryptDescription');

  const submitLabel = isLoading
    ? t('settings.vault.passwordDialog.processing')
    : mode === 'encrypt'
      ? t('settings.vault.passwordDialog.encryptButton')
      : t('settings.vault.passwordDialog.decryptButton');

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
        className="relative mx-4 w-full max-w-[400px] rounded-xl border border-border bg-surface p-6 shadow-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vault-password-dialog-title"
      >
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft">
          <Lock size={20} className="text-primary" aria-hidden="true" />
        </div>

        <h2 id="vault-password-dialog-title" className="mb-1 text-base font-semibold text-foreground">
          {title}
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {description}
        </p>

        <form onSubmit={handleFormSubmit}>
          <div className="mb-4">
            <Input
              label={t('settings.vault.passwordDialog.passwordLabel')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('settings.vault.passwordDialog.passwordPlaceholder')}
              autoFocus
            />
          </div>

          {error && (
            <p className="mb-3 text-xs text-expense" role="alert">{error}</p>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" type="button" onClick={onCancel} disabled={isLoading}>
              {t('settings.vault.passwordDialog.cancel')}
            </Button>
            <Button type="submit" disabled={password.length === 0 || isLoading}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
