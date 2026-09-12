export interface VaultBootstrap {
  readonly status: 'empty' | 'enrollment-required' | 'available';
  readonly vaultId?: string;
  readonly keyId?: string;
  readonly deviceId: string;
  readonly protocolVersion: 2;
  readonly cryptoSuite: 'HKDF-SHA256/AES-256-GCM';
  readonly securityProfile?: 'standard' | 'high-security';
  readonly deviceEnvelope?: string;
  readonly passkeyEnvelope?: string;
  readonly recoveryPublicKey?: string;
}

export interface VaultBootstrapRepository {
  get(
    userId: string,
    workspaceId: string,
    deviceId: string,
  ): Promise<VaultBootstrap>;
}
