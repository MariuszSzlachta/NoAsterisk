import { describe, expect, it } from 'vitest';

import { encodeRecoveryBackup } from '#shared/adapters/vault-protocol/recovery-backup/encode';
import { buildRecoveryBackupVector } from '#shared/adapters/vault-protocol/recovery-backup/testing/recovery-backup-vector';

describe('recovery backup encoding', () => {
  it('should produce canonical bytes without modifying either owned secret', async () => {
    const material = buildRecoveryBackupVector();
    await expect(encodeRecoveryBackup(material)).resolves.toBe(material.code);
    expect(material.vmk).toEqual(buildRecoveryBackupVector().vmk);
    expect(material.recoverySeed).toEqual(
      buildRecoveryBackupVector().recoverySeed,
    );
  });

  it.each([0, 31, 33])(
    'should reject a %i-byte VMK or recovery seed',
    async (length) => {
      const material = buildRecoveryBackupVector();
      await expect(
        encodeRecoveryBackup({ ...material, vmk: new Uint8Array(length) }),
      ).rejects.toThrow();
      await expect(
        encodeRecoveryBackup({
          ...material,
          recoverySeed: new Uint8Array(length),
        }),
      ).rejects.toThrow();
    },
  );
});
