import { confirmRecoveryRegistrationSchema } from '@vault-protocol/presentation/dto/recovery-registration/confirm-schema';
import { buildRecoveryRegistrationCommand } from '@vault-protocol/testing/build-recovery-registration-command';

describe('confirm recovery registration HTTP contract', () => {
  it('should require both bounded signatures and reject secret or ownership overrides', () => {
    const command = buildRecoveryRegistrationCommand();
    const request = {
      vaultId: command.vaultId,
      keyId: command.keyId,
      deviceId: command.deviceId,
      challenge: command.challenge,
      deviceSignature: command.deviceSignature,
      recoverySignature: command.recoverySignature,
    };
    expect(confirmRecoveryRegistrationSchema.safeParse(request).success).toBe(
      true,
    );
    expect(
      confirmRecoveryRegistrationSchema.safeParse({
        ...request,
        userId: 'override',
      }).success,
    ).toBe(false);
    expect(
      confirmRecoveryRegistrationSchema.safeParse({
        ...request,
        vmk: 'not-allowed',
      }).success,
    ).toBe(false);
    expect(
      confirmRecoveryRegistrationSchema.safeParse({
        ...request,
        recoverySignature: undefined,
      }).success,
    ).toBe(false);
    expect(
      confirmRecoveryRegistrationSchema.safeParse({
        ...request,
        deviceSignature: 'a'.repeat(129),
      }).success,
    ).toBe(false);
    expect(
      confirmRecoveryRegistrationSchema.safeParse({
        ...request,
        challenge: 'a'.repeat(44),
      }).success,
    ).toBe(false);
  });
});
