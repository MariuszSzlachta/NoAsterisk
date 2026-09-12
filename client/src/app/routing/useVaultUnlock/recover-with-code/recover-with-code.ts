import { enrollVmk } from '#app/routing/useVaultUnlock/enroll-vmk';
import type { EnrollmentBootstrap } from '#app/routing/useVaultUnlock/enroll-vmk/types';
import { deriveRecoveryPublicKey } from '#shared/adapters/vault-protocol/recovery-authority';
import { decodeRecoveryBackup } from '#shared/adapters/vault-protocol/recovery-backup';
import { bytesToHex } from '#shared/lib/bytes-to-hex';

export const recoverWithCode = async (
  accountId: string,
  workspaceId: string,
  bootstrap: EnrollmentBootstrap,
  code: string,
  assertCurrent: () => void,
): Promise<void> => {
  assertCurrent();
  const { vmk, recoverySeed } = await decodeRecoveryBackup(code);
  try {
    assertCurrent();
    if (
      bootstrap.status === 'empty' ||
      bootstrap.recoveryPublicKey !==
        bytesToHex(deriveRecoveryPublicKey(recoverySeed))
    )
      throw new Error('Recovery authority is unavailable');
    await enrollVmk(accountId, workspaceId, bootstrap, vmk, assertCurrent, {
      purpose: 'recovery',
      recoverySeed,
    });
    assertCurrent();
  } finally {
    vmk.fill(0);
    recoverySeed.fill(0);
  }
};
