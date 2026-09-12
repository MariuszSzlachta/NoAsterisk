import { recoveryBackupFormat } from '#shared/adapters/vault-protocol/recovery-backup/constants';
import { encodeRecoveryBackup } from '#shared/adapters/vault-protocol/recovery-backup/encode';
import type { CreatedRecoveryBackup } from '#shared/adapters/vault-protocol/recovery-backup/types';

export const createRecoveryBackup =
  async (): Promise<CreatedRecoveryBackup> => {
    const vmk = new Uint8Array(recoveryBackupFormat.secretBytes);
    const recoverySeed = new Uint8Array(recoveryBackupFormat.secretBytes);
    try {
      crypto.getRandomValues(vmk);
      crypto.getRandomValues(recoverySeed);
      const code = await encodeRecoveryBackup({ vmk, recoverySeed });
      return { code, vmk, recoverySeed };
    } catch (error) {
      vmk.fill(0);
      recoverySeed.fill(0);
      throw error;
    }
  };
