import { describe, expect, it } from 'vitest';

import { hashEnrollmentMessage } from '#shared/adapters/vault-protocol/enrollment-transcript/hash-message';

describe('native delegation/finalize digest', () => {
  it('should match the published SHA-256 abc vector and reject oversize bytes', async () => {
    await expect(
      hashEnrollmentMessage(new TextEncoder().encode('abc')),
    ).resolves.toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
    await expect(
      hashEnrollmentMessage(new Uint8Array(65_537)),
    ).rejects.toThrow();
  });
});
