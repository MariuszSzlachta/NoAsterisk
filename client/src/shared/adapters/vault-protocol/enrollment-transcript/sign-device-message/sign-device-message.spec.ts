import { describe, expect, it } from 'vitest';

import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import { enrollmentHexPattern } from '#shared/adapters/vault-protocol/enrollment-transcript/hex.pattern';
import { signEnrollmentDeviceMessage } from '#shared/adapters/vault-protocol/enrollment-transcript/sign-device-message';

describe('native new-device proof', () => {
  it('should sign real IEEE-P1363 bytes and reject wrong key usage or oversized messages', async () => {
    const keys = await deviceSigningKey.generate();
    const message = new TextEncoder().encode('synthetic-transcript');
    const signature = await signEnrollmentDeviceMessage(
      keys.privateKey,
      message,
    );
    expect(signature).toHaveLength(128);
    expect(signature).toMatch(enrollmentHexPattern);
    const raw = Uint8Array.from({ length: 64 }, (_, index) =>
      Number.parseInt(signature.slice(index * 2, index * 2 + 2), 16),
    );
    await expect(
      crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        keys.publicKey,
        raw,
        message,
      ),
    ).resolves.toBe(true);
    await expect(
      signEnrollmentDeviceMessage(keys.publicKey, message),
    ).rejects.toThrow();
    await expect(
      signEnrollmentDeviceMessage(keys.privateKey, new Uint8Array(65_537)),
    ).rejects.toThrow();
  });
});
