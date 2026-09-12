import { describe, expect, it } from 'vitest';

import { createRecoveryBackup } from '#shared/adapters/vault-protocol/recovery-backup/create';
import { decodeRecoveryBackup } from '#shared/adapters/vault-protocol/recovery-backup/decode';

describe('recovery backup creation', () => {
  it('should roundtrip both random roots in one code without aliases', async () => {
    const created = await createRecoveryBackup();
    const restored = await decodeRecoveryBackup(created.code);
    try {
      expect(restored.vmk).toEqual(created.vmk);
      expect(restored.recoverySeed).toEqual(created.recoverySeed);
      expect(created.vmk).not.toEqual(created.recoverySeed);
      expect(created.vmk.buffer).not.toBe(created.recoverySeed.buffer);
      created.vmk.fill(0);
      expect(restored.vmk).not.toEqual(created.vmk);
    } finally {
      created.vmk.fill(0);
      created.recoverySeed.fill(0);
      restored.vmk.fill(0);
      restored.recoverySeed.fill(0);
    }
  });
});
