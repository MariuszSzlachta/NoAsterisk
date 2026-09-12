import type { DataStats } from '#features/user-settings/model/types/data-stats';
import type { VaultInfo } from '#features/user-settings/model/types/vault-info';
import type { RotationRecoveryConfirmation } from '#features/user-settings/ui/hooks/useRotationRecoveryConfirmation/types';

export interface UseVaultSectionResult {
  readonly rotationRecoveryConfirmation: RotationRecoveryConfirmation;
  readonly vaultInfo: VaultInfo;
  readonly dataStats: DataStats;
  readonly isSyncing: boolean;
  readonly isChangingSecurity: boolean;
  readonly isRotating: boolean;
  readonly isHighSecurity: boolean;
  readonly isPasskeyUnlock: boolean;
  readonly importError: string | undefined;
  readonly fileInputRef: React.RefObject<HTMLInputElement | null>;
  readonly handleSync: () => void;
  readonly handleRestore: () => void;
  readonly handleExport: () => void;
  readonly handleTriggerImport: () => void;
  readonly handleFileInputChange: (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  readonly handleEnableHighSecurity: () => void;
  readonly handleEnablePasskeyUnlock: () => void;
  readonly handleRotateVmk: () => void;
}
