import {
  mapAvailableVaultBootstrap,
  mapEmptyVaultBootstrap,
  mapEnrollmentRequiredVaultBootstrap,
} from './map-vault-bootstrap';

describe('mapVaultBootstrap', () => {
  it('maps an empty vault without optional fields', () => {
    expect(mapEmptyVaultBootstrap('device-1')).toEqual({
      status: 'empty',
      deviceId: 'device-1',
      protocolVersion: 2,
      cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
    });
  });

  it('maps enrollment-required state with public recovery metadata', () => {
    expect(
      mapEnrollmentRequiredVaultBootstrap({
        deviceId: 'device-1',
        vaultId: 'vault-1',
        keyId: 'key-1',
        recoveryPublicKey: 'public-recovery-key',
      }),
    ).toEqual({
      status: 'enrollment-required',
      deviceId: 'device-1',
      vaultId: 'vault-1',
      keyId: 'key-1',
      recoveryPublicKey: 'public-recovery-key',
      protocolVersion: 2,
      cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
    });
  });

  it('requires at least one unlock envelope for an available vault', () => {
    expect(() =>
      mapAvailableVaultBootstrap({
        deviceId: 'device-1',
        keyset: {
          vaultId: 'vault-1',
          keyId: 'key-1',
          recoveryPublicKey: null,
        },
        securityProfile: 'standard',
        envelopes: [],
      }),
    ).toThrow('Vault device envelope is missing');
  });

  it('maps a passkey-only high-security vault', () => {
    expect(
      mapAvailableVaultBootstrap({
        deviceId: 'device-1',
        keyset: {
          vaultId: 'vault-1',
          keyId: 'key-1',
          recoveryPublicKey: 'public-recovery-key',
        },
        securityProfile: 'high-security',
        envelopes: [{ purpose: 'passkey-wrap', envelope: 'opaque-envelope' }],
      }),
    ).toEqual({
      status: 'available',
      deviceId: 'device-1',
      vaultId: 'vault-1',
      keyId: 'key-1',
      securityProfile: 'high-security',
      recoveryPublicKey: 'public-recovery-key',
      passkeyEnvelope: 'opaque-envelope',
      protocolVersion: 2,
      cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
    });
  });
});
