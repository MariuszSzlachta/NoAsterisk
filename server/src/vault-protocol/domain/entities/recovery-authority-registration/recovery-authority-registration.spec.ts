import { DomainError } from '@budget/domain';
import { RecoveryAuthorityRegistration } from '@vault-protocol/domain/entities/recovery-authority-registration';
import { buildRecoveryAuthority } from '@vault-protocol/testing/build-recovery-authority';
import { buildRecoveryRegistration } from '@vault-protocol/testing/build-recovery-registration';

describe('RecoveryAuthorityRegistration', () => {
  it('should consume only a live matching authority and preserve the complete transcript', () => {
    const registration = new RecoveryAuthorityRegistration(
      buildRecoveryRegistration(),
    );
    const consumed = registration.consume(buildRecoveryAuthority(), 2_000);
    expect(consumed.snapshot).toEqual({
      ...registration.snapshot,
      consumedAt: 2_000,
    });
    expect(consumed.toSigningBytes()).toEqual(registration.toSigningBytes());
    expect(() => consumed.consume(buildRecoveryAuthority(), 3_000)).toThrow(
      DomainError,
    );
  });

  it.each([999, 61_000, NaN, Infinity])(
    'should reject invalid or expired time %s',
    (now) => {
      const registration = new RecoveryAuthorityRegistration(
        buildRecoveryRegistration(),
      );
      expect(() => registration.consume(buildRecoveryAuthority(), now)).toThrow(
        DomainError,
      );
    },
  );

  it.each([
    buildRecoveryAuthority({ userId: 'other-user' }),
    buildRecoveryAuthority({ workspaceId: 'other-workspace' }),
    buildRecoveryAuthority({ vaultId: 'other-vault' }),
    buildRecoveryAuthority({ keyId: 'rotated-key' }),
    buildRecoveryAuthority({ deviceId: 'other-device' }),
    buildRecoveryAuthority({ signingPublicKey: 'replacement-key' }),
    buildRecoveryAuthority({ isDeviceRevoked: true }),
    buildRecoveryAuthority({ deviceStatus: 'pending' }),
    buildRecoveryAuthority({ protocolVersion: '1' }),
    buildRecoveryAuthority({ cryptoSuite: 'unsupported' }),
    buildRecoveryAuthority({ recoveryPublicKey: 'a'.repeat(64) }),
  ])(
    'should reject changed scope, revoked device, replaced key or existing authority',
    (authority) => {
      const registration = new RecoveryAuthorityRegistration(
        buildRecoveryRegistration(),
      );
      expect(() => registration.consume(authority, 2_000)).toThrow(DomainError);
    },
  );

  it('should bind every public context field and the precise expiry to the signing bytes', () => {
    const registration = new RecoveryAuthorityRegistration(
      buildRecoveryRegistration(),
    );
    expect(new TextDecoder().decode(registration.toSigningBytes())).toBe(
      '["budgetflow/recovery-authority-registration/v2",2,"HKDF-SHA256/AES-256-GCM","00000000-0000-4000-8000-000000000002","00000000-0000-4000-8000-000000000003","00000000-0000-4000-8000-000000000004","test-key","test-device","AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","1970-01-01T00:01:01.000Z","{\\"fixture\\":\\"public-device-key\\"}","d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a"]',
    );
  });
});
