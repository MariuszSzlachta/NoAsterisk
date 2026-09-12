import { DomainError } from '@budget/domain';
import { generateKeyPairSync } from 'node:crypto';
import type { SignedEnrollmentInput } from '@vault-protocol/domain/entities/signed-enrollment';
import { validateEnrollmentPublicKeys } from '@vault-protocol/infrastructure/signed-enrollment/validate-public-keys';

describe('validateEnrollmentPublicKeys', () => {
  const signing = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const ephemeral = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const input: SignedEnrollmentInput = {
    purpose: 'trusted',
    accountId: 'account',
    workspaceId: 'workspace',
    vaultId: 'vault',
    keyId: 'key',
    deviceId: 'device',
    oldDeviceId: 'approver',
    signingPublicKey: JSON.stringify(
      signing.publicKey.export({ format: 'jwk' }),
    ),
    newEphemeralPublicKey: JSON.stringify(
      ephemeral.publicKey.export({ format: 'jwk' }),
    ),
  };
  it('should accept actual P-256 public points and reject private material, invalid points and signing usages on ECDH keys', () => {
    expect(() => {
      validateEnrollmentPublicKeys(input);
    }).not.toThrow();
    for (const substitution of [
      { signingPublicKey: '{' },
      {
        signingPublicKey: JSON.stringify(
          signing.privateKey.export({ format: 'jwk' }),
        ),
      },
      {
        newEphemeralPublicKey: JSON.stringify(
          ephemeral.privateKey.export({ format: 'jwk' }),
        ),
      },
      {
        newEphemeralPublicKey: JSON.stringify({
          ...ephemeral.publicKey.export({ format: 'jwk' }),
          key_ops: ['verify'],
        }),
      },
      {
        signingPublicKey: JSON.stringify({
          ...signing.publicKey.export({ format: 'jwk' }),
          x: 'A'.repeat(43),
          y: 'A'.repeat(43),
        }),
      },
    ]) {
      expect(() => {
        validateEnrollmentPublicKeys({ ...input, ...substitution });
      }).toThrow(DomainError);
    }
  });
});
