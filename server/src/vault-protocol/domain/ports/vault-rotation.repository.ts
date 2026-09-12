export const VAULT_ROTATION_REPOSITORY = Symbol('VAULT_ROTATION_REPOSITORY');

export type VaultEnvelopePurpose = 'device-wrap' | 'passkey-wrap';

export interface RotateVaultRequest {
  readonly userId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly deviceId: string;
  readonly currentKeyId: string;
  readonly nextKeyId: string;
  readonly envelopePurpose: VaultEnvelopePurpose;
  readonly envelope: string;
  /** Optional second envelope retained for standard PRF unlock. */
  readonly passkeyEnvelope?: string;
  readonly protocolVersion: '2';
  readonly cryptoSuite: 'HKDF-SHA256/AES-256-GCM';
  readonly idempotencyKey: string;
}

export interface RotateVaultResult {
  readonly status: 'rotated';
  readonly keyId: string;
  readonly revokedDeviceCount: number;
}

export interface VaultRotationRepository {
  rotate(request: RotateVaultRequest): Promise<RotateVaultResult>;
}
