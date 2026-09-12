import type { RecoveryBackupMaterial } from '#shared/adapters/vault-protocol/recovery-backup/types';

export interface RecoveryBackupVector extends RecoveryBackupMaterial {
  readonly code: string;
}
