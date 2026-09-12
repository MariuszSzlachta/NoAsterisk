export interface PrepareRecoveryRegistrationDto {
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
  readonly recoveryPublicKey: string;
  readonly recoveryConfirmed: true;
}

export interface ConfirmRecoveryRegistrationDto {
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
  readonly challenge: string;
  readonly deviceSignature: string;
  readonly recoverySignature: string;
}

export interface RecoveryRegistrationResponseDto {
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
