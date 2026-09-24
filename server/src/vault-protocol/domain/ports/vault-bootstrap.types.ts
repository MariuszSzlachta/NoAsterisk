export interface VaultBootstrapBase {
  readonly deviceId: string;
  readonly protocolVersion: 2;
  readonly cryptoSuite: 'HKDF-SHA256/AES-256-GCM';
}

export interface EmptyVaultBootstrap extends VaultBootstrapBase {
  readonly status: 'empty';
}

export interface EnrollmentRequiredVaultBootstrap extends VaultBootstrapBase {
  readonly status: 'enrollment-required';
  readonly vaultId: string;
  readonly keyId?: string;
  readonly recoveryPublicKey?: string;
}

type VaultEnvelopeProjection =
  | { readonly deviceEnvelope: string; readonly passkeyEnvelope?: string }
  | { readonly deviceEnvelope?: string; readonly passkeyEnvelope: string };

export type AvailableVaultBootstrap = VaultBootstrapBase &
  VaultEnvelopeProjection & {
    readonly status: 'available';
    readonly vaultId: string;
    readonly keyId: string;
    readonly securityProfile: 'standard' | 'high-security';
    readonly recoveryPublicKey?: string;
  };

export type VaultBootstrap =
  | EmptyVaultBootstrap
  | EnrollmentRequiredVaultBootstrap
  | AvailableVaultBootstrap;
