import { describe, expect, it } from 'vitest';

import { computeRecoveryBackupChecksum } from '#shared/adapters/vault-protocol/recovery-backup/checksum';

describe('recovery backup checksum', () => {
  it('should match the domain-separated vector for the complete payload', async () => {
    const payload = Uint8Array.from({ length: 64 }, (_, index) => index);
    await expect(computeRecoveryBackupChecksum(payload)).resolves.toEqual(
      Uint8Array.of(0x86, 0x63, 0xa8, 0x8d),
    );
  });

  it.each([0, 32, 63, 65])(
    'should reject a payload of %i bytes',
    async (length) => {
      await expect(
        computeRecoveryBackupChecksum(new Uint8Array(length)),
      ).rejects.toThrow('Invalid recovery backup');
    },
  );
});
