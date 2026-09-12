import { describe, expect, it } from 'vitest';

import { decodeRecoveryBackup } from '#shared/adapters/vault-protocol/recovery-backup/decode';
import { buildRecoveryBackupVector } from '#shared/adapters/vault-protocol/recovery-backup/testing/recovery-backup-vector';

describe('recovery backup decoding', () => {
  it('should recover separate owned buffers for the canonical vector', async () => {
    const vector = buildRecoveryBackupVector();
    const restored = await decodeRecoveryBackup(vector.code);
    expect(restored.vmk).toEqual(vector.vmk);
    expect(restored.recoverySeed).toEqual(vector.recoverySeed);
    restored.vmk.fill(0);
    expect(restored.recoverySeed).toEqual(vector.recoverySeed);
  });

  it.each([
    '',
    '0'.repeat(72),
    buildRecoveryBackupVector().code.toUpperCase(),
    `${buildRecoveryBackupVector().code}\n`,
    buildRecoveryBackupVector().code.slice(0, -1),
    buildRecoveryBackupVector().code.replace('BF2:', 'BF3:'),
    buildRecoveryBackupVector().code.replace('0001', '1001'),
    `${buildRecoveryBackupVector().code.slice(0, -1)}0`,
    'BF2:' + 'g'.repeat(136),
  ])('should reject a malformed or legacy representation', async (code) => {
    await expect(decodeRecoveryBackup(code)).rejects.toThrow(
      'Invalid recovery backup',
    );
  });
});
