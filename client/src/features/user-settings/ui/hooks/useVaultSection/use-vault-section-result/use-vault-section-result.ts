import type { DataStats } from '#features/user-settings/model/types/data-stats';
import type { VaultInfo } from '#features/user-settings/model/types/vault-info';
import type { VaultPasswordMode } from '#features/user-settings/ui/VaultPasswordDialog/vault-password-mode';

export interface UseVaultSectionResult {
  readonly vaultInfo: VaultInfo;
  readonly dataStats: DataStats;
  readonly isSyncing: boolean;
  readonly importError: string | undefined;
  readonly fileInputRef: React.RefObject<HTMLInputElement | null>;
  readonly showPasswordDialog: boolean;
  readonly passwordDialogMode: VaultPasswordMode;
  readonly passwordError: string | undefined;
  readonly handleSync: () => void;
  readonly handleRestore: () => void;
  readonly handleExport: () => void;
  readonly handleTriggerImport: () => void;
  readonly handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly handlePasswordSubmit: (password: string) => void;
  readonly handlePasswordCancel: () => void;
}
