export interface RecoveryRegistrationScope {
  readonly userId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
}

export interface RecoveryRegistrationSnapshot extends RecoveryRegistrationScope {
  readonly id: string;
  readonly challenge: string;
  readonly signingPublicKey: string;
  readonly recoveryPublicKey: string;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly consumedAt?: number;
}

export interface CurrentRecoveryRegistrationAuthority extends RecoveryRegistrationScope {
  readonly protocolVersion: string;
  readonly cryptoSuite: string;
  readonly signingPublicKey: string;
  readonly deviceStatus: string;
  readonly isDeviceRevoked: boolean;
  readonly recoveryPublicKey: string | undefined;
}

export interface PrepareRecoveryRegistration extends RecoveryRegistrationScope {
  readonly recoveryPublicKey: string;
}

export interface ConfirmRecoveryRegistration extends RecoveryRegistrationScope {
  readonly challenge: string;
  readonly deviceSignature: string;
  readonly recoverySignature: string;
}
