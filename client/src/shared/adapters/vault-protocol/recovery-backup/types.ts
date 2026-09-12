export interface RecoveryBackupMaterial {
  readonly vmk: Uint8Array<ArrayBuffer>;
  readonly recoverySeed: Uint8Array<ArrayBuffer>;
}

export interface CreatedRecoveryBackup extends RecoveryBackupMaterial {
  readonly code: string;
}
