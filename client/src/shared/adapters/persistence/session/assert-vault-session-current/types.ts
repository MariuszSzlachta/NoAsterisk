export interface VaultSessionContext {
  readonly accountId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
}

export interface VaultSessionReader {
  readonly isUnlocked: () => boolean;
  readonly getGeneration: () => number;
  readonly requireVaultSyncMaterial: () => {
    readonly context: VaultSessionContext;
  };
}
