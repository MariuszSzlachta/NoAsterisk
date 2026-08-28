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
