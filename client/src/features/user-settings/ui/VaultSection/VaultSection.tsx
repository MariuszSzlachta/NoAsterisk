// User Settings — VaultSection Component

import { useTranslation } from 'react-i18next';
import { Download, Lock, RefreshCw, RotateCcw, Upload } from 'lucide-react';

import { useVaultSection } from '#features/user-settings/ui/hooks/useVaultSection';
import { STATUS_COLORS } from '#features/user-settings/ui/VaultSection/constants/status-colors';
import { STATUS_I18N } from '#features/user-settings/ui/VaultSection/constants/status-i18n';
import { STATUS_ICONS } from '#features/user-settings/ui/VaultSection/constants/status-icons';
import { StatCard } from '#features/user-settings/ui/VaultSection/StatCard';
import { Button } from '#shared/ui/Button';
import { Card } from '#shared/ui/Card';
import { TrustedDeviceApproval } from '#features/user-settings/ui/TrustedDeviceApproval';

export const VaultSection = (): React.JSX.Element => {
  const { t } = useTranslation();
  const {
    vaultInfo,
    dataStats,
    isSyncing,
    isChangingSecurity,
    isRotating,
    isHighSecurity,
    isPasskeyUnlock,
    importError,
    fileInputRef,
    handleSync,
    handleRestore,
    handleExport,
    handleTriggerImport,
    handleFileInputChange,
    handleEnableHighSecurity,
    handleEnablePasskeyUnlock,
    handleRotateVmk,
  } = useVaultSection();

  return (
    <>
      <TrustedDeviceApproval />
      <Card className="">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground">
            {t('settings.vault.title')}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t('settings.vault.subtitle')}
          </p>
        </div>

        {/* Status Card */}
        <div
          className={`mb-4 flex items-center gap-3 rounded-lg border p-3 ${STATUS_COLORS[vaultInfo.status]}`}
          role="status"
          aria-live="polite"
        >
          <div aria-hidden="true">{STATUS_ICONS[vaultInfo.status]}</div>
          <div>
            <div className="text-sm font-medium text-foreground">
              {t(STATUS_I18N[vaultInfo.status])}
            </div>
            <div className="text-xs text-muted-foreground">
              {vaultInfo.lastSync
                ? t('settings.vault.lastSync', { date: vaultInfo.lastSync })
                : t('settings.vault.noSuccessfulSync')}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            onClick={handleSync}
            disabled={isSyncing}
            icon={
              <RefreshCw
                size={14}
                className={isSyncing ? 'animate-spin' : ''}
              />
            }
          >
            {isSyncing ? t('settings.vault.syncing') : t('settings.vault.sync')}
          </Button>
          <Button
            variant="secondary"
            onClick={handleRotateVmk}
            disabled={isSyncing || isChangingSecurity || isRotating}
          >
            {isRotating
              ? t('settings.vault.rotationChanging')
              : t('settings.vault.rotateKey')}
          </Button>
          <Button
            variant="secondary"
            onClick={handleRestore}
            icon={<RotateCcw size={14} />}
            disabled={vaultInfo.status === 'never-synced' || isSyncing}
          >
            {t('settings.vault.restore')}
          </Button>
          <Button
            variant="secondary"
            onClick={handleExport}
            icon={<Download size={14} />}
          >
            {t('settings.vault.export')}
          </Button>
          <Button
            variant="secondary"
            onClick={handleTriggerImport}
            icon={<Upload size={14} />}
          >
            {t('settings.vault.import')}
          </Button>
          <Button
            variant="secondary"
            onClick={handleEnableHighSecurity}
            disabled={isSyncing || isChangingSecurity}
          >
            {isChangingSecurity
              ? t('settings.vault.highSecurityChanging')
              : t(
                  isHighSecurity
                    ? 'settings.vault.highSecurityDisable'
                    : 'settings.vault.highSecurityEnable',
                )}
          </Button>
          {!isHighSecurity && (
            <Button
              variant="secondary"
              onClick={handleEnablePasskeyUnlock}
              disabled={
                isSyncing || isChangingSecurity || isPasskeyUnlock
              }
            >
              {isPasskeyUnlock
                ? t('settings.vault.passkeyEnabledLabel')
                : t('settings.vault.passkeyEnable')}
            </Button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileInputChange}
          aria-label={t('settings.vault.importLabel')}
        />

        {importError && (
          <p className="mb-4 text-xs text-expense" role="alert">
            {importError}
          </p>
        )}

        {/* Info Box */}
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-surface-3 p-3">
          <Lock
            size={14}
            className="mt-0.5 shrink-0 text-subtle"
            aria-hidden="true"
          />
          <p className="text-xs text-muted-foreground">
            {t('settings.vault.encryptionInfo')}
          </p>
        </div>

        {/* Data Stats */}
        <div className="flex flex-wrap gap-2">
          <StatCard
            label={t('settings.vault.stats.transactions')}
            value={dataStats.transactions}
          />
          <StatCard
            label={t('settings.vault.stats.categories')}
            value={dataStats.categories}
          />
          <StatCard
            label={t('settings.vault.stats.budgets')}
            value={dataStats.budgets}
          />
          <StatCard
            label={t('settings.vault.stats.rules')}
            value={dataStats.rules}
          />
          <StatCard
            label={t('settings.vault.stats.periodHistory')}
            value={dataStats.periodHistory}
          />
          <StatCard
            label={t('settings.vault.stats.importHistory')}
            value={dataStats.importHistory}
          />
          <StatCard
            label={t('settings.vault.stats.size')}
            value={`~${dataStats.sizeKb} KB`}
          />
        </div>
      </Card>
    </>
  );
};
