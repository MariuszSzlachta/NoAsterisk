import type { AvailableVaultBootstrapMetadata } from '#shared/api/vault-protocol/get-vault-bootstrap/types';

export const buildVaultBootstrapMetadata = (
  overrides: Partial<AvailableVaultBootstrapMetadata> = {},
): AvailableVaultBootstrapMetadata => ({
  status: 'available',
  vaultId: 'vault-1',
  keyId: 'key-1',
  deviceId: 'device-1',
  protocolVersion: 2,
  cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
  securityProfile: 'standard',
  deviceEnvelope: 'opaque-envelope',
  ...overrides,
});
