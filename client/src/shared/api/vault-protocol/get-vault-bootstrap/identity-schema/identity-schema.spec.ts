import { describe, expect, it } from 'vitest';

import { vaultBootstrapIdentitySchema } from '#shared/api/vault-protocol/get-vault-bootstrap/identity-schema';
import { buildVaultBootstrapMetadata } from '#shared/api/vault-protocol/get-vault-bootstrap/testing/build-vault-bootstrap-metadata';

describe('bootstrap wire identity schema', () => {
  it('should accept only the supported protocol and bounded device identity', () => {
    const metadata = buildVaultBootstrapMetadata();
    const identity = {
      deviceId: metadata.deviceId,
      protocolVersion: metadata.protocolVersion,
      cryptoSuite: metadata.cryptoSuite,
    };
    expect(vaultBootstrapIdentitySchema.safeParse(identity).success).toBe(true);
    expect(
      vaultBootstrapIdentitySchema.safeParse({ ...identity, deviceId: '' })
        .success,
    ).toBe(false);
    expect(
      vaultBootstrapIdentitySchema.safeParse({
        ...identity,
        deviceId: 'a'.repeat(129),
      }).success,
    ).toBe(false);
    expect(
      vaultBootstrapIdentitySchema.safeParse({
        ...identity,
        protocolVersion: 1,
      }).success,
    ).toBe(false);
    expect(
      vaultBootstrapIdentitySchema.safeParse({
        ...identity,
        cryptoSuite: 'other-suite',
      }).success,
    ).toBe(false);
  });
});
