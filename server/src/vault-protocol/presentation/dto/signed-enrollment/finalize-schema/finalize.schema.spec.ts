import { finalizeSignedEnrollmentSchema } from '@vault-protocol/presentation/dto/signed-enrollment/finalize-schema';

describe('finalizeSignedEnrollmentSchema', () => {
  const common = {
    vaultId: '12345678-1234-4234-8234-123456789abc',
    keyId: 'key',
    deviceId: 'device',
    challenge: 'A'.repeat(43),
    deviceEnvelope: '{}',
    deviceSignature: 'a'.repeat(128),
  };

  it('accepts each complete proof without a strict-object intersection rejecting the discriminator', () => {
    for (const request of [
      { ...common, purpose: 'initial', recoverySignature: 'b'.repeat(128) },
      { ...common, purpose: 'recovery', recoverySignature: 'b'.repeat(128) },
      {
        ...common,
        purpose: 'trusted',
        delegationSignature: 'b'.repeat(128),
        delegationDigest: 'c'.repeat(64),
      },
    ]) {
      expect(finalizeSignedEnrollmentSchema.safeParse(request).success).toBe(
        true,
      );
      expect(
        finalizeSignedEnrollmentSchema.safeParse({
          ...request,
          passkeyEnvelope: '{}',
        }).success,
      ).toBe(true);
    }
  });

  it('rejects missing, mixed, malformed proofs and client changes to the prepared key or authority', () => {
    const request = {
      ...common,
      purpose: 'recovery',
      recoverySignature: 'b'.repeat(128),
    };
    for (const substitution of [
      { accountId: 'other' },
      { workspaceId: 'other' },
      { signingPublicKey: '{}' },
      { recoveryPublicKey: 'c'.repeat(64) },
      { recoverySeed: 'secret' },
      { vmk: 'secret' },
      { delegationSignature: 'b'.repeat(128) },
      { purpose: 'trusted' },
      { deviceSignature: 'a'.repeat(127) },
      { recoverySignature: 'B'.repeat(128) },
      { challenge: `${'A'.repeat(43)}\n` },
      { deviceEnvelope: 'a'.repeat(20_001) },
      { passkeyEnvelope: 'a'.repeat(20_001) },
    ]) {
      expect(
        finalizeSignedEnrollmentSchema.safeParse({
          ...request,
          ...substitution,
        }).success,
      ).toBe(false);
    }
    expect(
      finalizeSignedEnrollmentSchema.safeParse({
        ...common,
        purpose: 'recovery',
      }).success,
    ).toBe(false);
  });
});
