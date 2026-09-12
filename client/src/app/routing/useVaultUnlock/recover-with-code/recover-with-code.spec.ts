import { beforeEach, describe, expect, it, vi } from 'vitest';

import { enrollVmk } from '#app/routing/useVaultUnlock/enroll-vmk';
import { recoverWithCode } from '#app/routing/useVaultUnlock/recover-with-code';
import { deriveRecoveryPublicKey } from '#shared/adapters/vault-protocol/recovery-authority';
import { createRecoveryBackup } from '#shared/adapters/vault-protocol/recovery-backup';
import { bytesToHex } from '#shared/lib/bytes-to-hex';

const boundary = vi.hoisted(() => ({ enroll: vi.fn<typeof enrollVmk>() }));
vi.mock('#app/routing/useVaultUnlock/enroll-vmk', () => ({
  enrollVmk: boundary.enroll,
}));
beforeEach(() => vi.resetAllMocks());
describe('recoverWithCode', () => {
  it.each([false, true])(
    'should clear both owned roots after successful or rejected enrollment; rejected=%s',
    async (rejected) => {
      const backup = await createRecoveryBackup();
      try {
        boundary.enroll.mockImplementation(
          async (
            _account,
            _workspace,
            _bootstrap,
            vmk,
            _guard,
            authorization,
          ) => {
            expect(vmk).toEqual(backup.vmk);
            if (authorization.purpose === 'trusted')
              throw new Error('Unexpected authority');
            expect(authorization.recoverySeed).toEqual(backup.recoverySeed);
            if (rejected) throw new Error('Enrollment rejected');
          },
        );
        const operation = recoverWithCode(
          'account',
          'workspace',
          {
            status: 'enrollment-required',
            vaultId: 'vault',
            keyId: 'key',
            deviceId: 'device',
            recoveryPublicKey: bytesToHex(
              deriveRecoveryPublicKey(backup.recoverySeed),
            ),
          },
          backup.code,
          () => {},
        );
        if (rejected)
          await expect(operation).rejects.toThrow('Enrollment rejected');
        else await operation;
        const call = boundary.enroll.mock.calls[0];
        if (call === undefined || call[5].purpose === 'trusted')
          throw new Error('Expected recovery enrollment');
        expect(call[3].every((byte) => byte === 0)).toBe(true);
        expect(call[5].recoverySeed.every((byte) => byte === 0)).toBe(true);
      } finally {
        backup.vmk.fill(0);
        backup.recoverySeed.fill(0);
      }
    },
  );
  it('should reject a foreign authority without enrolling or creating an empty vault', async () => {
    const backup = await createRecoveryBackup();
    try {
      await expect(
        recoverWithCode(
          'account',
          'workspace',
          {
            status: 'enrollment-required',
            vaultId: 'vault',
            keyId: 'key',
            deviceId: 'device',
            recoveryPublicKey: '0'.repeat(64),
          },
          backup.code,
          () => {},
        ),
      ).rejects.toThrow('authority');
      expect(boundary.enroll).not.toHaveBeenCalled();
    } finally {
      backup.vmk.fill(0);
      backup.recoverySeed.fill(0);
    }
  });
});
