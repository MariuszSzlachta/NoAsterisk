import { computeRecoveryBackupChecksum } from '#shared/adapters/vault-protocol/recovery-backup/checksum';
import { recoveryBackupFormat } from '#shared/adapters/vault-protocol/recovery-backup/constants';
import type { RecoveryBackupMaterial } from '#shared/adapters/vault-protocol/recovery-backup/types';
import { bytesToHex } from '#shared/lib/bytes-to-hex';

export const encodeRecoveryBackup = async (
  material: RecoveryBackupMaterial,
): Promise<string> => {
  if (
    material.vmk.length !== recoveryBackupFormat.secretBytes ||
    material.recoverySeed.length !== recoveryBackupFormat.secretBytes
  )
    throw new Error('Invalid recovery backup');
  const payload = new Uint8Array(recoveryBackupFormat.payloadBytes);
  payload.set(material.vmk);
  payload.set(material.recoverySeed, recoveryBackupFormat.secretBytes);
  let checksum: Uint8Array | undefined;
  try {
    checksum = await computeRecoveryBackupChecksum(payload);
    return `${recoveryBackupFormat.prefix}${bytesToHex(payload)}${bytesToHex(checksum)}`;
  } finally {
    checksum?.fill(0);
    payload.fill(0);
  }
};
