import { DomainError } from '@budget/domain';
import { mapRecoveryRegistrationRowToDomain } from '@vault-protocol/infrastructure/mappers/map-recovery-registration';
import { buildRecoveryRegistration } from '@vault-protocol/testing/build-recovery-registration';
import { buildRecoveryRegistrationRow } from '@vault-protocol/testing/build-recovery-registration-row';

describe('recovery challenge persistence mapping', () => {
  it('should reconstruct the complete pending and consumed domain state', () => {
    expect(
      mapRecoveryRegistrationRowToDomain(buildRecoveryRegistrationRow())
        .snapshot,
    ).toEqual(buildRecoveryRegistration());
    expect(
      mapRecoveryRegistrationRowToDomain(
        buildRecoveryRegistrationRow({ consumedAt: new Date(2_000) }),
      ).snapshot,
    ).toEqual(buildRecoveryRegistration({ consumedAt: 2_000 }));
  });

  it('should reject invalid persisted dates and key lengths through domain invariants', () => {
    expect(() =>
      mapRecoveryRegistrationRowToDomain(
        buildRecoveryRegistrationRow({ expiresAt: new Date(NaN) }),
      ),
    ).toThrow(DomainError);
    expect(() =>
      mapRecoveryRegistrationRowToDomain(
        buildRecoveryRegistrationRow({ recoveryPublicKey: 'short' }),
      ),
    ).toThrow(DomainError);
  });
});
