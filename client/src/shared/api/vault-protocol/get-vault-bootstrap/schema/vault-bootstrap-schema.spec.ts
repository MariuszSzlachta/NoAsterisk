import { describe, expect, it } from 'vitest';

import { vaultBootstrapSchema } from '#shared/api/vault-protocol/get-vault-bootstrap/schema';
import { buildVaultBootstrapMetadata } from '#shared/api/vault-protocol/get-vault-bootstrap/testing/build-vault-bootstrap-metadata';

describe('vault bootstrap wire schema', () => {
  it('should distinguish empty, legacy enrollment and decryptable metadata without accepting incomplete available state', () => {
    const metadata = buildVaultBootstrapMetadata();
    const identity = {
      deviceId: metadata.deviceId,
      protocolVersion: metadata.protocolVersion,
      cryptoSuite: metadata.cryptoSuite,
    };
    expect(
      vaultBootstrapSchema.safeParse({ ...identity, status: 'empty' }).success,
    ).toBe(true);
    expect(
      vaultBootstrapSchema.safeParse({
        ...identity,
        status: 'enrollment-required',
      }).success,
    ).toBe(true);
    expect(
      vaultBootstrapSchema.safeParse({ ...identity, status: 'available' })
        .success,
    ).toBe(false);
    expect(
      vaultBootstrapSchema.safeParse({
        ...identity,
        status: 'empty',
        recoveryPublicKey: 'a'.repeat(64),
      }).success,
    ).toBe(false);
  });
  it('should preserve registered public authority and accept legacy authority absence', () => {
    const legacy = buildVaultBootstrapMetadata();
    expect(vaultBootstrapSchema.parse(legacy)).toEqual(legacy);
    const upgraded = buildVaultBootstrapMetadata({
      recoveryPublicKey: 'a'.repeat(64),
    });
    expect(vaultBootstrapSchema.parse(upgraded)).toEqual(upgraded);
  });

  it.each(['', 'a'.repeat(63), 'a'.repeat(65), 'A'.repeat(64)])(
    'should reject a malformed recovery verification key',
    (key) => {
      expect(
        vaultBootstrapSchema.safeParse(
          buildVaultBootstrapMetadata({ recoveryPublicKey: key }),
        ).success,
      ).toBe(false);
    },
  );

  it('should reject private material and oversized public metadata at the HTTP boundary', () => {
    expect(
      vaultBootstrapSchema.safeParse({
        ...buildVaultBootstrapMetadata(),
        recoverySeed: 'secret',
      }).success,
    ).toBe(false);
    expect(
      vaultBootstrapSchema.safeParse(
        buildVaultBootstrapMetadata({ deviceEnvelope: 'a'.repeat(20_001) }),
      ).success,
    ).toBe(false);
    expect(
      vaultBootstrapSchema.safeParse(
        buildVaultBootstrapMetadata({ deviceId: '' }),
      ).success,
    ).toBe(false);
  });
});
