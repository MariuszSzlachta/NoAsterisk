import { describe, expect, it } from 'vitest';

import { encodeRecoveryRegistration } from '#shared/adapters/vault-protocol/recovery-registration/encode';
import { buildRecoveryRegistrationIntent } from '#shared/adapters/vault-protocol/recovery-registration/testing/build-intent';

describe('encodeRecoveryRegistration', () => {
  it('should match the backend signing tuple exactly without rewriting public key bytes', () => {
    const intent = buildRecoveryRegistrationIntent({
      expiresAt: '2026-09-12T12:00:00.000Z',
      signingPublicKey: '{ "kty": "EC" }',
    });
    expect(new TextDecoder().decode(encodeRecoveryRegistration(intent))).toBe(
      JSON.stringify([
        'budgetflow/recovery-authority-registration/v2',
        2,
        'HKDF-SHA256/AES-256-GCM',
        'account',
        'workspace',
        'vault',
        'key',
        'device',
        'A'.repeat(43),
        '2026-09-12T12:00:00.000Z',
        '{ "kty": "EC" }',
        'a'.repeat(64),
      ]),
    );
  });
  it('should reject malformed claims and preserve bounded escaped signing bytes', () => {
    expect(() =>
      encodeRecoveryRegistration(
        buildRecoveryRegistrationIntent({ challenge: 'A'.repeat(42) + '\n' }),
      ),
    ).toThrow();
    expect(() =>
      encodeRecoveryRegistration(
        buildRecoveryRegistrationIntent({ accountId: '' }),
      ),
    ).toThrow();
    expect(() =>
      encodeRecoveryRegistration(
        buildRecoveryRegistrationIntent({
          signingPublicKey: 'a'.repeat(10_001),
        }),
      ),
    ).toThrow();
    expect(() =>
      encodeRecoveryRegistration(
        buildRecoveryRegistrationIntent({
          signingPublicKey: '\u0000'.repeat(10_000),
          accountId: '\u0000'.repeat(128),
          workspaceId: '\u0000'.repeat(128),
          vaultId: '\u0000'.repeat(128),
          keyId: '\u0000'.repeat(128),
          deviceId: '\u0000'.repeat(128),
        }),
      ),
    ).not.toThrow();
  });
});
