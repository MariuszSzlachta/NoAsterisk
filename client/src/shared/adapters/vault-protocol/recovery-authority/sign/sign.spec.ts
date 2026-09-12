import { describe, expect, it } from 'vitest';

import { signRecoveryMessage } from '#shared/adapters/vault-protocol/recovery-authority/sign';
import { buildRecoverySignatureVector } from '#shared/adapters/vault-protocol/recovery-authority/testing/rfc8032-vector';

describe('recovery message signing', () => {
  it('should match the RFC-8032 signature and preserve caller buffers', () => {
    const vector = buildRecoverySignatureVector();
    expect(signRecoveryMessage(vector.seed, vector.message)).toEqual(
      vector.signature,
    );
    expect(vector.seed).toEqual(buildRecoverySignatureVector().seed);
  });

  it('should reject oversized messages before signing', () => {
    expect(() =>
      signRecoveryMessage(
        buildRecoverySignatureVector().seed,
        new Uint8Array(65_537),
      ),
    ).toThrow();
  });

  it.each([0, 31, 33])('should reject a %i-byte seed', (length) => {
    expect(() =>
      signRecoveryMessage(new Uint8Array(length), new Uint8Array()),
    ).toThrow();
  });
});
