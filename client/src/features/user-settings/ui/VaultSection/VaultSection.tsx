// ═══════════════════════════════════════════════════════════════════
// User Settings — VaultSection Component
// ═══════════════════════════════════════════════════════════════════

import { CheckCircle, Download, Lock, RefreshCw, RotateCcw, Upload, XCircle } from 'lucide-react';

import type { VaultSyncStatus } from '#features/user-settings/model/types';
import { useVaultSection } from '#features/user-settings/ui/hooks/useVaultSection';
import { Button } from '#shared/ui/Button';
import { Card } from '#shared/ui/Card';

// ─── Status Config ───────────────────────────────────────────────

const STATUS_CONFIG: Record<VaultSyncStatus, { icon: React.ReactNode; label: string; colorClass: string }> = {
  synced: {
    icon: <CheckCircle size={20} className="text-income" />,
    label: 'Zsynchronizowane',
    colorClass: 'border-income/30 bg-income/5',
  },
  unsynced: {
    icon: <RefreshCw size={20} className="text-warning" />,
    label: 'Niezapisane zmiany',
    colorClass: 'border-warning/30 bg-warning/5',
  },
  'no-backup': {
    icon: <XCircle size={20} className="text-expense" />,
    label: 'Brak backupu',
    colorClass: 'border-expense/30 bg-expense/5',
  },
};

// ─── Component ───────────────────────────────────────────────────

export const VaultSection = (): React.JSX.Element => {
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

  const statusConfig = STATUS_CONFIG[vaultInfo.status];

  return (
    <Card className="mb-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">Dane i synchronizacja</h2>
        <p className="text-xs text-muted-foreground">Zaszyfrowana kopia zapasowa Twoich danych lokalnych.</p>
      </div>

      {/* Status Card */}
      <div className={`mb-4 flex items-center gap-3 rounded-lg border p-3 ${statusConfig.colorClass}`}>
        <div aria-hidden="true">{statusConfig.icon}</div>
        <div>
          <div className="text-sm font-medium text-foreground">{statusConfig.label}</div>
          <div className="text-xs text-muted-foreground">
            {vaultInfo.lastSync ? `Ostatnia synchronizacja: ${vaultInfo.lastSync}` : 'Brak backupu'}
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
          {isSyncing ? 'Synchronizuję...' : 'Synchronizuj teraz'}
        </Button>
        <Button
          variant="secondary"
          icon={<RotateCcw size={14} />}
          disabled={vaultInfo.status === 'no-backup'}
        >
          Przywróć z backupu
        </Button>
        <Button
          variant="secondary"
          onClick={handleExport}
          icon={<Download size={14} />}
        >
          Eksportuj dane (JSON)
        </Button>
        <Button
          variant="secondary"
          onClick={handleTriggerImport}
          icon={<Upload size={14} />}
        >
          Importuj dane (JSON)
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileInputChange}
        aria-label="Wybierz plik JSON do importu"
      />

      {importError && (
        <p className="mb-4 text-xs text-expense" role="alert">{importError}</p>
      )}

      {/* Info Box */}
      <div className="mb-4 flex items-start gap-2 rounded-lg bg-surface-3 p-3">
        <Lock size={14} className="mt-0.5 shrink-0 text-subtle" aria-hidden="true" />
        <p className="text-xs text-muted-foreground">
          Twoje dane są szyfrowane w przeglądarce kluczem wyprowadzonym z Twojego hasła. Serwer przechowuje jedynie zaszyfrowany blob — nie ma dostępu do Twoich danych finansowych.
        </p>
      </div>

      {/* Data Stats */}
      <div className="flex flex-wrap gap-2">
        <StatCard label="Transakcje" value={dataStats.transactions} />
        <StatCard label="Budżety" value={dataStats.budgets} />
        <StatCard label="Reguły" value={dataStats.rules} />
        <StatCard label="Profile importu" value={dataStats.importProfiles} />
        <StatCard label="Rozmiar" value={`~${dataStats.sizeKb} KB`} />
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
