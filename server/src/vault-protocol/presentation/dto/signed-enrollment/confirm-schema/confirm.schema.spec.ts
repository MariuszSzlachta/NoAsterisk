import { confirmSignedEnrollmentSchema } from '@vault-protocol/presentation/dto/signed-enrollment/confirm-schema';

describe('confirmSignedEnrollmentSchema', () => {
  const request = {
    vaultId: '12345678-1234-4234-8234-123456789abc',
    keyId: 'key',
    deviceId: 'device',
    challenge: 'A'.repeat(43),
    digest: 'a'.repeat(64),
    signature: 'b'.repeat(128),
  };

  it('requires the complete signed acknowledgement rather than an unsigned challenge-only request', () => {
    expect(confirmSignedEnrollmentSchema.safeParse(request).success).toBe(true);
    expect(
      confirmSignedEnrollmentSchema.safeParse({
        challenge: request.challenge,
        deviceId: request.deviceId,
      }).success,
    ).toBe(false);
  });

  it('rejects ambiguous or unbounded signature/context fields and secrets', () => {
    for (const substitution of [
      { accountId: 'other' },
      { workspaceId: 'other' },
      { vmk: 'secret' },
      { recoverySeed: 'secret' },
      { digest: 'A'.repeat(64) },
      { digest: `${'a'.repeat(63)}\n` },
      { signature: `${'b'.repeat(127)}\n` },
      { challenge: `${'A'.repeat(42)}\n` },
      { signature: `${'b'.repeat(128)}\n` },
      { challenge: 'A'.repeat(44) },
      { deviceId: '' },
      { deviceId: 'a'.repeat(129) },
      { vaultId: 'not-uuid' },
    ]) {
      expect(
        confirmSignedEnrollmentSchema.safeParse({ ...request, ...substitution })
          .success,
      ).toBe(false);
    }
  });
});
