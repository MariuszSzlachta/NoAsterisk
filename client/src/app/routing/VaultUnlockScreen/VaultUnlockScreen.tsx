import { useTranslation } from 'react-i18next';

import { useVaultUnlock } from '#app/routing/useVaultUnlock';
import type { PersistenceSessionSnapshot } from '#shared/adapters/persistence';
import { Button } from '#shared/ui/Button';
import { Input } from '#shared/ui/Input';

interface VaultUnlockScreenProps {
  readonly snapshot: PersistenceSessionSnapshot;
}

export const VaultUnlockScreen = ({
  snapshot,
}: VaultUnlockScreenProps): React.JSX.Element => {
  const { t } = useTranslation();
  const {
    error,
    handlePassphraseChange,
    handleSubmit,
    isUnlocking,
    passphrase,
  } = useVaultUnlock(snapshot);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            {t('app.name')}
          </p>
          <h1 className="text-2xl font-semibold text-foreground">
            {t('vaultUnlock.title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('vaultUnlock.description')}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            id="vault-passphrase"
            label={t('vaultUnlock.passphrase')}
            type="password"
            autoComplete="off"
            value={passphrase}
            onChange={handlePassphraseChange}
            required
          />

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {snapshot.warning && (
            <p role="status" className="text-sm text-warning">
              {snapshot.warning}
            </p>
          )}
          {(snapshot.storage === 'denied' ||
            snapshot.storage === 'unavailable') && (
            <p role="status" className="text-sm text-warning">
              {t('vaultUnlock.storageWarning')}
            </p>
          )}

          <Button
            type="submit"
            disabled={isUnlocking || passphrase.length === 0}
            className="w-full"
          >
            {isUnlocking ? t('vaultUnlock.unlocking') : t('vaultUnlock.submit')}
          </Button>
        </form>

        <p className="mt-6 text-xs text-muted-foreground">
          {t('vaultUnlock.securityNote')}
        </p>
      </section>
    </main>
  );
};
