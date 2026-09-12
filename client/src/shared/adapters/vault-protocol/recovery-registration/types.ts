export interface RecoveryRegistrationIntent {
  readonly accountId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
  readonly challenge: string;
  readonly expiresAt: string;
  readonly signingPublicKey: string;
  readonly recoveryPublicKey: string;
}
