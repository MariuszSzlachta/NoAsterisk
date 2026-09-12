import { DomainError } from '@budget/domain';
import { mapRecoveryAuthorityRowToDomain } from '@vault-protocol/infrastructure/mappers/map-recovery-authority';
import { buildRecoveryAuthority } from '@vault-protocol/testing/build-recovery-authority';

describe('recovery authority persistence mapping', () => {
  it('should preserve scope and status while mapping SQL null to absent authority', () => {
    const expected = buildRecoveryAuthority();
    expect(
      mapRecoveryAuthorityRowToDomain({
        ...expected,
        keysetId: 'keyset',
        recoveryPublicKey: null,
      }),
    ).toEqual(expected);
  });

  it('should preserve existing authority and revocation without deciding whether registration is allowed', () => {
    const expected = buildRecoveryAuthority({
      recoveryPublicKey: 'a'.repeat(64),
      isDeviceRevoked: true,
      deviceStatus: 'revoked',
    });
    expect(
      mapRecoveryAuthorityRowToDomain({
        ...expected,
        keysetId: 'keyset',
        recoveryPublicKey: expected.recoveryPublicKey ?? null,
      }),
    ).toEqual(expected);
  });

  it('should fail closed when the stored device signing authority is missing', () => {
    expect(() =>
      mapRecoveryAuthorityRowToDomain({
        ...buildRecoveryAuthority(),
        keysetId: 'keyset',
        signingPublicKey: null,
        recoveryPublicKey: null,
      }),
    ).toThrow(DomainError);
  });
});
