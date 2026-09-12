export const VAULT_SECURITY_REPOSITORY = Symbol('VAULT_SECURITY_REPOSITORY');

export interface EnableHighSecurityRequest {
  readonly userId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
  readonly passkeyEnvelope: string;
}

export interface VaultSecurityRepository {
  enablePasskeyUnlock(request: EnableHighSecurityRequest): Promise<void>;
  enableHighSecurity(request: EnableHighSecurityRequest): Promise<void>;
  disableHighSecurity(request: EnableHighSecurityRequest): Promise<void>;
}
