import { describe, expect, it } from 'vitest';

import { buildRecoverySignatureVector } from '#shared/adapters/vault-protocol/recovery-authority/testing/rfc8032-vector';
import { verifyRecoveryMessage } from '#shared/adapters/vault-protocol/recovery-authority/verify';

describe('recovery message verification', () => {
  it('should reject a small-order identity forgery consistently with the server', () => {
    const identity = new Uint8Array(32);
    identity[0] = 1;
    const signature = new Uint8Array(64);
    signature[0] = 1;
    expect(verifyRecoveryMessage(identity, Uint8Array.of(1), signature)).toBe(
      false,
    );
  });
  it('should accept the RFC-8032 signature', () => {
    const vector = buildRecoverySignatureVector();
    expect(
      verifyRecoveryMessage(vector.publicKey, vector.message, vector.signature),
    ).toBe(true);
  });

  it('should reject a changed message, signature, or authority', () => {
    const vector = buildRecoverySignatureVector();
    expect(
      verifyRecoveryMessage(
        vector.publicKey,
        Uint8Array.of(1),
        vector.signature,
      ),
    ).toBe(false);
    vector.signature[0] = 0;
    expect(
      verifyRecoveryMessage(vector.publicKey, vector.message, vector.signature),
    ).toBe(false);
    expect(
      verifyRecoveryMessage(
        new Uint8Array(32),
        vector.message,
        vector.signature,
      ),
    ).toBe(false);
  });

  it.each([0, 31, 33])('should reject a %i-byte public key', (length) => {
    const vector = buildRecoverySignatureVector();
    expect(
      verifyRecoveryMessage(
        new Uint8Array(length),
        vector.message,
        vector.signature,
      ),
    ).toBe(false);
  });

  it.each([0, 63, 65])('should reject a %i-byte signature', (length) => {
    const vector = buildRecoverySignatureVector();
    expect(
      verifyRecoveryMessage(
        vector.publicKey,
        vector.message,
        new Uint8Array(length),
      ),
    ).toBe(false);
  });

  it('should reject oversized messages', () => {
    const vector = buildRecoverySignatureVector();
    expect(
      verifyRecoveryMessage(
        vector.publicKey,
        new Uint8Array(65_537),
        vector.signature,
      ),
    ).toBe(false);
  });
});
