import type {
  VaultSessionContext,
  VaultSessionReader,
} from '#shared/adapters/persistence/session/assert-vault-session-current/types';

export const assertVaultSessionCurrent = (
  session: VaultSessionReader,
  generation: number,
  context: VaultSessionContext,
): void => {
  if (!session.isUnlocked() || session.getGeneration() !== generation)
    throw new Error('Vault operation session changed');
  const current = session.requireVaultSyncMaterial().context;
  if (
    current.accountId !== context.accountId ||
    current.workspaceId !== context.workspaceId ||
    current.vaultId !== context.vaultId ||
    current.keyId !== context.keyId ||
    current.deviceId !== context.deviceId
  )
    throw new Error('Vault operation context changed');
};
