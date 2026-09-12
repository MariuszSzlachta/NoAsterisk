export interface RecoveryRegistrationRequest {
  readonly accountId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
  readonly recoveryPublicKey: string;
}
export interface RecoveryRegistrationConfirmation {
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
  readonly challenge: string;
  readonly deviceSignature: string;
  readonly recoverySignature: string;
}
