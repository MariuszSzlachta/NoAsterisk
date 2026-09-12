import type { RecoveryBackupVector } from '#shared/adapters/vault-protocol/recovery-backup/testing/recovery-backup-vector/types';

/** Public synthetic protocol vector, never usable as a user backup. */
export const buildRecoveryBackupVector = (): RecoveryBackupVector => ({
  vmk: Uint8Array.from({ length: 32 }, (_, index) => index),
  recoverySeed: Uint8Array.from({ length: 32 }, (_, index) => index + 32),
  code: 'BF2:000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f8663a88d',
});
