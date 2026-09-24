export interface VaultBootstrapIdentity {
  readonly deviceId: string;
  readonly protocolVersion: 2;
  readonly cryptoSuite: 'HKDF-SHA256/AES-256-GCM';
}

export interface EmptyVaultBootstrapMetadata extends VaultBootstrapIdentity {
  readonly status: 'empty';
}

export interface EnrollmentRequiredVaultBootstrapMetadata extends VaultBootstrapIdentity {
  readonly status: 'enrollment-required';
  /** Legacy control-plane vaults may not have a v2 keyset yet. */
  readonly vaultId?: string;
  readonly keyId?: string;
  readonly recoveryPublicKey?: string;
}

type VaultEnvelopeMetadata =
  | { readonly deviceEnvelope: string; readonly passkeyEnvelope?: string }
  | { readonly deviceEnvelope?: string; readonly passkeyEnvelope: string };

export type AvailableVaultBootstrapMetadata = VaultBootstrapIdentity &
  VaultEnvelopeMetadata & {
    readonly status: 'available';
    readonly vaultId: string;
    readonly keyId: string;
    readonly securityProfile: 'standard' | 'high-security';
    readonly recoveryPublicKey?: string;
  };

export type VaultBootstrapMetadata =
  | EmptyVaultBootstrapMetadata
  | EnrollmentRequiredVaultBootstrapMetadata
  | AvailableVaultBootstrapMetadata;
