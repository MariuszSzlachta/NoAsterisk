export interface EnrollmentPreparation {
  readonly challenge: string;
  readonly serverShare: Uint8Array;
  readonly expiresAt: string;
}

export interface VaultEnrollmentRequest {
  readonly challenge: string;
  readonly userId: string;
  readonly workspaceId: string;
  readonly deviceId: string;
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceEnvelope: string;
  readonly signingPublicKey: string;
  readonly passkeyEnvelope?: string;
  /** Signed, ciphertext-only approval from an already enrolled device. */
  readonly trustedDeviceProof?: string;
}

export interface VaultEnrollmentConfirmation {
  readonly challenge: string;
  readonly userId: string;
  readonly workspaceId: string;
  readonly deviceId: string;
  readonly vaultId: string;
  readonly keyId: string;
}

export interface VaultEnrollmentRepository {
  prepare(
    userId: string,
    workspaceId: string,
    deviceId: string,
    vaultId?: string,
  ): Promise<EnrollmentPreparation>;
  finalize(request: VaultEnrollmentRequest): Promise<void>;
  confirm(request: VaultEnrollmentConfirmation): Promise<void>;
}
