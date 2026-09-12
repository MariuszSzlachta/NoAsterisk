import { computeRecoveryBackupChecksum } from '#shared/adapters/vault-protocol/recovery-backup/checksum';
import { recoveryBackupFormat } from '#shared/adapters/vault-protocol/recovery-backup/constants';
import { recoveryBackupPattern } from '#shared/adapters/vault-protocol/recovery-backup/decode/recovery-backup.pattern';
import type { RecoveryBackupMaterial } from '#shared/adapters/vault-protocol/recovery-backup/types';
import { HEX_ENCODING } from '#shared/lib/bytes-to-hex/constants/hex-encoding';

export const decodeRecoveryBackup = async (
  code: string,
): Promise<RecoveryBackupMaterial> => {
  if (
    code.length !== recoveryBackupFormat.encodedLength ||
    !recoveryBackupPattern.test(code)
  )
    throw new Error('Invalid recovery backup');
  const encoded = code.slice(recoveryBackupFormat.prefix.length);
  const bytes = Uint8Array.from(
    {
      length:
        recoveryBackupFormat.payloadBytes + recoveryBackupFormat.checksumBytes,
    },
    (_, index) =>
      Number.parseInt(
        encoded.slice(
          index * HEX_ENCODING.width,
          (index + 1) * HEX_ENCODING.width,
        ),
        HEX_ENCODING.radix,
      ),
  );
  let expected: Uint8Array | undefined;
  let payload: Uint8Array<ArrayBuffer> | undefined;
  try {
    payload = bytes.slice(0, recoveryBackupFormat.payloadBytes);
    expected = await computeRecoveryBackupChecksum(payload);
    const isValid = expected.every(
      (byte, index) =>
        byte === bytes[recoveryBackupFormat.payloadBytes + index],
    );
    if (!isValid) throw new Error('Invalid recovery backup');
    return {
      vmk: payload.slice(0, recoveryBackupFormat.secretBytes),
      recoverySeed: payload.slice(recoveryBackupFormat.secretBytes),
    };
  } finally {
    expected?.fill(0);
    payload?.fill(0);
    bytes.fill(0);
  }
};
