import { useTranslation } from 'react-i18next';

import { useVaultUnlock } from '#app/routing/useVaultUnlock';
import type { PersistenceSessionSnapshot } from '#shared/adapters/persistence';
import { Button } from '#shared/ui/Button';
import { Input } from '#shared/ui/Input';
import { TrustedDeviceQrScanner } from '#shared/ui/TrustedDeviceQrScanner';

interface VaultUnlockScreenProps {
  readonly snapshot: PersistenceSessionSnapshot;
  readonly accountId: string;
  readonly workspaceId: string;
}

export const VaultUnlockScreen = ({
  snapshot,
  accountId,
  workspaceId,
}: VaultUnlockScreenProps): React.JSX.Element => {
  const { t } = useTranslation();
  const {
    error,
    handleRetry,
    isUnlocking,
    canRetry,
    requiresRecovery,
    isInitialSetup,
    recoveryCode,
    recoverySetupCode,
    recoverySetupQrSvg,
    handleRecoveryCodeChange,
    handleRecovery,
    handleStartInitialSetup,
    handleConfirmInitialSetup,
    handleCopyRecoveryCode,
    handleDownloadRecoveryCode,
    trustedDeviceFlow,
    trustedDeviceRequestQrSvg,
    trustedDeviceError,
    handleStartTrustedDeviceEnrollment,
    handleStartTrustedDeviceResponseScan,
    handleTrustedDeviceResponseScan,
    handleTrustedDeviceError,
    handleCancelTrustedDeviceEnrollment,
  } = useVaultUnlock(
    snapshot,
    accountId,
    workspaceId,
  );

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

        {error && (
          <p role="alert" className="mb-4 text-sm text-destructive">
            {error}
          </p>
        )}
        {snapshot.warning && (
          <p role="status" className="mb-4 text-sm text-warning">
            {snapshot.warning}
          </p>
        )}
        {(snapshot.storage === 'denied' || snapshot.storage === 'unavailable') && (
          <p role="status" className="mb-4 text-sm text-warning">
            {t('vaultUnlock.storageWarning')}
          </p>
        )}

        {requiresRecovery ? (
          <div className="space-y-3">
            {trustedDeviceFlow !== 'idle' ? (
              <>
                {trustedDeviceFlow === 'show-request' && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {t('vaultUnlock.trustedDeviceRequestDescription')}
                    </p>
                    {trustedDeviceRequestQrSvg !== undefined && (
                      <div
                        className="mx-auto w-fit rounded-md bg-white p-3"
                        aria-label={t('vaultUnlock.trustedDeviceRequestTitle')}
                        role="img"
                        dangerouslySetInnerHTML={{ __html: trustedDeviceRequestQrSvg }}
                      />
                    )}
                    <Button
                      type="button"
                      disabled={!canRetry}
                      onClick={handleStartTrustedDeviceResponseScan}
                      className="w-full"
                    >
                      {t('vaultUnlock.trustedDeviceScan')}
                    </Button>
                  </>
                )}
                {trustedDeviceFlow === 'scan-response' && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {t('vaultUnlock.trustedDeviceResponseDescription')}
                    </p>
                    <TrustedDeviceQrScanner
                      active
                      onScan={handleTrustedDeviceResponseScan}
                      onError={handleTrustedDeviceError}
                    />
                  </>
                )}
                {trustedDeviceError !== undefined && (
                  <p role="alert" className="text-sm text-destructive">
                    {trustedDeviceError}
                  </p>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancelTrustedDeviceEnrollment}
                  className="w-full"
                >
                  {t('vaultUnlock.trustedDeviceCancel')}
                </Button>
              </>
            ) : recoverySetupCode === undefined ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {isInitialSetup
                    ? t('vaultUnlock.initialSetupDescription')
                    : t('vaultUnlock.recoveryDescription')}
                </p>
                {isInitialSetup && (
                  <Button
                    type="button"
                    disabled={!canRetry}
                    onClick={handleStartInitialSetup}
                    className="w-full"
                  >
                    {t('vaultUnlock.createRecovery')}
                  </Button>
                )}
                {!isInitialSetup && (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={!canRetry}
                      onClick={handleStartTrustedDeviceEnrollment}
                      className="w-full"
                    >
                      {t('vaultUnlock.trustedDeviceStart')}
                    </Button>
                    <Input
                      id="vault-recovery-code"
                      label={t('vaultUnlock.recoveryCode')}
                      type="password"
                      autoComplete="off"
                      value={recoveryCode}
                      onChange={(event) => handleRecoveryCodeChange(event.currentTarget.value)}
                    />
                    <Button
                      type="button"
                      disabled={!canRetry || recoveryCode.length === 0}
                      onClick={handleRecovery}
                      className="w-full"
                    >
                      {isUnlocking ? t('vaultUnlock.unlocking') : t('vaultUnlock.recover')}
                    </Button>
                  </>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {t('vaultUnlock.recoverySetupDescription')}
                </p>
                <code className="block select-all break-all rounded-md border border-border bg-surface-2 p-3 text-xs text-foreground">
                  {recoverySetupCode}
                </code>
                {recoverySetupQrSvg !== undefined && (
                  <div
                    className="mx-auto w-fit rounded-md bg-white p-3"
                    aria-label={t('vaultUnlock.recoveryQr')}
                    role="img"
                    dangerouslySetInnerHTML={{ __html: recoverySetupQrSvg }}
                  />
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="secondary" onClick={handleCopyRecoveryCode}>
                    {t('vaultUnlock.copyRecovery')}
                  </Button>
                  <Button type="button" variant="secondary" onClick={handleDownloadRecoveryCode}>
                    {t('vaultUnlock.downloadRecovery')}
                  </Button>
                </div>
                <Button
                  type="button"
                  disabled={!canRetry}
                  onClick={handleConfirmInitialSetup}
                  className="w-full"
                >
                  {isUnlocking ? t('vaultUnlock.unlocking') : t('vaultUnlock.confirmRecovery')}
                </Button>
              </>
            )}
          </div>
        ) : (
          <Button
            type="button"
            disabled={!canRetry}
            onClick={handleRetry}
            className="w-full"
          >
            {isUnlocking ? t('vaultUnlock.unlocking') : t('vaultUnlock.submit')}
          </Button>
        )}

        <p className="mt-6 text-xs text-muted-foreground">
          {t('vaultUnlock.securityNote')}
        </p>
      </section>
    </main>
  );
};
