import { VAULT_NETWORK_TIMEOUT_MS } from '#features/user-settings/api/constants/vault-network-timeout';
import { readRecoveryUpgradeBootstrap } from '#features/user-settings/api/read-recovery-upgrade-bootstrap';
import { registerRecoveryAuthority } from '#features/user-settings/api/register-recovery-authority';
import type { RecoveryBackupUpgradeOutcome } from '#features/user-settings/model/recovery-backup-upgrade/types';
import { encryptedPersistence } from '#shared/adapters/persistence';
import { assertVaultSessionCurrent } from '#shared/adapters/persistence/session/assert-vault-session-current';
import { encodeRecoveryBackup } from '#shared/adapters/vault-protocol/recovery-backup';
import { recoveryBackupFormat } from '#shared/adapters/vault-protocol/recovery-backup/constants';

export const upgradeRecoveryBackup = async (
  confirmBackup: (code: string) => Promise<boolean>,
  assertFlowCurrent: () => void,
): Promise<RecoveryBackupUpgradeOutcome> => {
  assertFlowCurrent();
  const generation = encryptedPersistence.getGeneration();
  const { context } = encryptedPersistence.requireVaultSyncMaterial();
  const assertCurrent = (): void => {
    assertFlowCurrent();
    assertVaultSessionCurrent(encryptedPersistence, generation, context);
  };
  const bootstrap = await readRecoveryUpgradeBootstrap(
    context,
    AbortSignal.timeout(VAULT_NETWORK_TIMEOUT_MS),
    assertCurrent,
  );
  if (bootstrap.recoveryPublicKey !== undefined) return 'already-registered';
  const owned = encryptedPersistence.getVaultTransferMaterial(context);
  const recoverySeed = new Uint8Array(recoveryBackupFormat.secretBytes);
  const vmk = new Uint8Array(owned.vmk);
  try {
    crypto.getRandomValues(recoverySeed);
    const code = await encodeRecoveryBackup({ vmk, recoverySeed });
    assertCurrent();
    if (!(await confirmBackup(code))) return 'cancelled';
    assertCurrent();
    await registerRecoveryAuthority({
      context,
      recoverySeed,
      signingKey: owned.signingKey,
      signingPublicKey: owned.signingPublicKey,
      assertCurrent,
    });
    return 'registered';
  } finally {
    owned.vmk.fill(0);
    vmk.fill(0);
    recoverySeed.fill(0);
  }
};
