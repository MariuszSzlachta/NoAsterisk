import { recoveryBackupFormat } from '#shared/adapters/vault-protocol/recovery-backup/constants';

export const computeRecoveryBackupChecksum = async (
  payload: Uint8Array,
): Promise<Uint8Array<ArrayBuffer>> => {
  if (payload.length !== recoveryBackupFormat.payloadBytes)
    throw new Error('Invalid recovery backup');
  const domain = new TextEncoder().encode(recoveryBackupFormat.checksumDomain);
  const message = new Uint8Array(domain.length + payload.length);
  message.set(domain);
  message.set(payload, domain.length);
  try {
    const digest = new Uint8Array(
      await crypto.subtle.digest('SHA-256', message.buffer),
    );
    try {
      return digest.slice(0, recoveryBackupFormat.checksumBytes);
    } finally {
      digest.fill(0);
    }
  } finally {
    message.fill(0);
  }
};
