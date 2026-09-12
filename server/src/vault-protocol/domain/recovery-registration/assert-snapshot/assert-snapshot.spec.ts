import { DomainError } from '@budget/domain';
import { assertRecoveryRegistrationSnapshot } from '@vault-protocol/domain/recovery-registration/assert-snapshot';
import { buildRecoveryRegistration } from '@vault-protocol/testing/build-recovery-registration';

describe('recovery registration snapshot invariants', () => {
  it('should accept a valid persisted pending or consumed challenge', () => {
    expect(() => {
      assertRecoveryRegistrationSnapshot(buildRecoveryRegistration());
    }).not.toThrow();
    expect(() => {
      assertRecoveryRegistrationSnapshot(
        buildRecoveryRegistration({ consumedAt: 2_000 }),
      );
    }).not.toThrow();
  });

  it.each([
    buildRecoveryRegistration({ id: '' }),
    buildRecoveryRegistration({ userId: '' }),
    buildRecoveryRegistration({ workspaceId: 'a'.repeat(129) }),
    buildRecoveryRegistration({ challenge: 'short' }),
    buildRecoveryRegistration({ challenge: `${'A'.repeat(43)}\n` }),
    buildRecoveryRegistration({ recoveryPublicKey: `${'a'.repeat(64)}\n` }),
    buildRecoveryRegistration({
      createdAt: 8_640_000_000_000_000,
      expiresAt: 8_640_000_000_060_000,
    }),
    buildRecoveryRegistration({ recoveryPublicKey: 'A'.repeat(64) }),
    buildRecoveryRegistration({ signingPublicKey: '' }),
    buildRecoveryRegistration({ createdAt: NaN }),
    buildRecoveryRegistration({ createdAt: -1 }),
    buildRecoveryRegistration({ expiresAt: 61_001 }),
    buildRecoveryRegistration({ consumedAt: 999 }),
    buildRecoveryRegistration({ consumedAt: 61_000 }),
  ])('should reject invalid rehydrated state', (snapshot) => {
    expect(() => {
      assertRecoveryRegistrationSnapshot(snapshot);
    }).toThrow(DomainError);
  });
});
