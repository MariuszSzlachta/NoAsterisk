import { describe, expect, it } from 'vitest';

import { deriveRecoveryPublicKey } from '#shared/adapters/vault-protocol/recovery-authority/derive';
import { buildRecoverySignatureVector } from '#shared/adapters/vault-protocol/recovery-authority/testing/rfc8032-vector';

describe('recovery public authority', () => {
  it('should derive the RFC-8032 public key without erasing the caller seed', () => {
    const vector = buildRecoverySignatureVector();
    expect(deriveRecoveryPublicKey(vector.seed)).toEqual(vector.publicKey);
    expect(vector.seed).toEqual(buildRecoverySignatureVector().seed);
  });

  it.each([0, 31, 33])('should reject a %i-byte seed', (length) => {
    expect(() => deriveRecoveryPublicKey(new Uint8Array(length))).toThrow(
      'Invalid recovery authority',
    );
  });
});
