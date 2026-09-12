export interface VaultDeviceSummary {
  readonly deviceId: string;
  readonly vaultId: string;
  readonly keyId: string;
  readonly status: string;
  readonly createdAt: string;
  readonly lastSeenAt: string;
  readonly signingPublicKey?: string;
  readonly revokedAt?: string;
}

export interface VaultDeviceRepository {
  list(
    userId: string,
    workspaceId: string,
  ): Promise<ReadonlyArray<VaultDeviceSummary>>;
  revoke(userId: string, workspaceId: string, deviceId: string): Promise<void>;
}
