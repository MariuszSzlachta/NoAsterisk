// ═══════════════════════════════════════════════════════════════════
// User Settings — VaultSection Component
// ═══════════════════════════════════════════════════════════════════

import { CheckCircle, Download, Lock, RefreshCw, RotateCcw, Upload, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { VaultSyncStatus } from '#features/user-settings/model/types';
import { useVaultSection } from '#features/user-settings/ui/hooks/useVaultSection';
import { Button } from '#shared/ui/Button';
import { Card } from '#shared/ui/Card';

// ─── Status Config ───────────────────────────────────────────────

const STATUS_ICONS: Record<VaultSyncStatus, React.ReactNode> = {
  synced: <CheckCircle size={20} className="text-income" />,
  unsynced: <RefreshCw size={20} className="text-warning" />,
  'no-backup': <XCircle size={20} className="text-expense" />,
};

const STATUS_COLORS: Record<VaultSyncStatus, string> = {
  synced: 'border-income/30 bg-income/5',
  unsynced: 'border-warning/30 bg-warning/5',
  'no-backup': 'border-expense/30 bg-expense/5',
};

const STATUS_I18N: Record<VaultSyncStatus, string> = {
  synced: 'settings.vault.statusSynced',
  unsynced: 'settings.vault.statusUnsynced',
  'no-backup': 'settings.vault.statusNoBackup',
};

// ─── Component ───────────────────────────────────────────────────

export const VaultSection = (): React.JSX.Element => {
  const { t } = useTranslation();
  const {
    vaultInfo,
    dataStats,
    isSyncing,
    importError,
    fileInputRef,
    handleSync,
    handleExport,
    handleTriggerImport,
    handleFileInputChange,
  } = useVaultSection();

  return (
    <Card className="">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">{t('settings.vault.title')}</h2>
        <p className="text-xs text-muted-foreground">{t('settings.vault.subtitle')}</p>
      </div>

      {/* Status Card */}
      <div className={`mb-4 flex items-center gap-3 rounded-lg border p-3 ${STATUS_COLORS[vaultInfo.status]}`}>
        <div aria-hidden="true">{STATUS_ICONS[vaultInfo.status]}</div>
        <div>
          <div className="text-sm font-medium text-foreground">{t(STATUS_I18N[vaultInfo.status])}</div>
          <div className="text-xs text-muted-foreground">
            {vaultInfo.lastSync ? t('settings.vault.lastSync', { date: vaultInfo.lastSync }) : t('settings.vault.noBackup')}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          onClick={handleSync}
          disabled={isSyncing}
          icon={<RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />}
        >
          {isSyncing ? t('settings.vault.syncing') : t('settings.vault.sync')}
        </Button>
        <Button
          variant="secondary"
          icon={<RotateCcw size={14} />}
          disabled={vaultInfo.status === 'no-backup'}
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
        <p className="mb-4 text-xs text-expense" role="alert">{importError}</p>
      )}

      {/* Info Box */}
      <div className="mb-4 flex items-start gap-2 rounded-lg bg-surface-3 p-3">
        <Lock size={14} className="mt-0.5 shrink-0 text-subtle" aria-hidden="true" />
        <p className="text-xs text-muted-foreground">{t('settings.vault.encryptionInfo')}</p>
      </div>

      {/* Data Stats */}
      <div className="flex flex-wrap gap-2">
        <StatCard label={t('settings.vault.stats.transactions')} value={dataStats.transactions} />
        <StatCard label={t('settings.vault.stats.budgets')} value={dataStats.budgets} />
        <StatCard label={t('settings.vault.stats.rules')} value={dataStats.rules} />
        <StatCard label={t('settings.vault.stats.importProfiles')} value={dataStats.importProfiles} />
        <StatCard label={t('settings.vault.stats.size')} value={`~${dataStats.sizeKb} KB`} />
      </div>
    </Card>
  );
};

// ─── StatCard Sub-component ──────────────────────────────────────

interface StatCardProps {
  readonly label: string;
  readonly value: number | string;
}

const StatCard = ({ label, value }: StatCardProps): React.JSX.Element => (
  <div className="flex flex-col items-center rounded-md border border-border bg-surface-2 px-3 py-2">
    <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
    <span className="text-[10px] text-muted-foreground">{label}</span>
  </div>
);
