import { prepareSignedEnrollmentSchema } from '@vault-protocol/presentation/dto/signed-enrollment/prepare-schema';

describe('prepareSignedEnrollmentSchema', () => {
  const common = {
    vaultId: '12345678-1234-4234-8234-123456789abc',
    keyId: 'key',
    deviceId: 'device',
    signingPublicKey: '{}',
  };

  it('accepts exactly the initial, recovery and trusted public intents', () => {
    const intents = [
      { ...common, purpose: 'initial', recoveryPublicKey: 'a'.repeat(64) },
      { ...common, purpose: 'recovery', recoveryPublicKey: 'a'.repeat(64) },
      {
        ...common,
        purpose: 'trusted',
        oldDeviceId: 'approver',
        newEphemeralPublicKey: '{}',
      },
    ];
    for (const intent of intents)
      expect(
        prepareSignedEnrollmentSchema.safeParse({
          recoveryConfirmed: true,
          intent,
        }).success,
      ).toBe(true);
  });

  it('rejects client-supplied authority, challenges, secrets, mixed purposes and unconfirmed recovery', () => {
    const intent = {
      ...common,
      purpose: 'recovery',
      recoveryPublicKey: 'a'.repeat(64),
    };
    for (const substitution of [
      { accountId: 'other' },
      { workspaceId: 'other' },
      { challenge: 'A'.repeat(43) },
      { vmk: 'secret' },
      { recoverySeed: 'secret' },
      { oldDeviceId: 'approver' },
      { recoveryPublicKey: 'A'.repeat(64) },
      { recoveryPublicKey: `${'a'.repeat(64)}\n` },
      { deviceId: 'a'.repeat(129) },
      { signingPublicKey: 'a'.repeat(10_001) },
    ]) {
      expect(
        prepareSignedEnrollmentSchema.safeParse({
          recoveryConfirmed: true,
          intent: { ...intent, ...substitution },
        }).success,
      ).toBe(false);
    }
    expect(
      prepareSignedEnrollmentSchema.safeParse({
        recoveryConfirmed: false,
        intent,
      }).success,
    ).toBe(false);
    expect(
      prepareSignedEnrollmentSchema.safeParse({
        recoveryConfirmed: true,
        intent,
        accountId: 'other',
      }).success,
    ).toBe(false);
  });
});
