import { prepareRecoveryRegistrationSchema } from '@vault-protocol/presentation/dto/recovery-registration/prepare-schema';
import { buildRecoveryRegistration } from '@vault-protocol/testing/build-recovery-registration';

describe('prepare recovery registration HTTP contract', () => {
  it('should accept only public authority and explicitly confirmed backup context', () => {
    const snapshot = buildRecoveryRegistration();
    const request = {
      vaultId: snapshot.vaultId,
      keyId: snapshot.keyId,
      deviceId: snapshot.deviceId,
      recoveryPublicKey: snapshot.recoveryPublicKey,
      recoveryConfirmed: true,
    };
    expect(prepareRecoveryRegistrationSchema.safeParse(request).success).toBe(
      true,
    );
    expect(
      prepareRecoveryRegistrationSchema.safeParse({
        ...request,
        recoverySeed: 'not-allowed',
      }).success,
    ).toBe(false);
    expect(
      prepareRecoveryRegistrationSchema.safeParse({
        ...request,
        recoveryConfirmed: false,
      }).success,
    ).toBe(false);
    expect(
      prepareRecoveryRegistrationSchema.safeParse({
        ...request,
        recoveryPublicKey: 'A'.repeat(64),
      }).success,
    ).toBe(false);
    expect(
      prepareRecoveryRegistrationSchema.safeParse({
        ...request,
        deviceId: 'a'.repeat(129),
      }).success,
    ).toBe(false);
  });
});
