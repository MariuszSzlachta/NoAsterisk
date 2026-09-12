import type { VaultSessionContext } from '#shared/adapters/persistence/session/assert-vault-session-current/types';
import type { AvailableVaultBootstrapMetadata } from '#shared/api/vault-protocol/get-vault-bootstrap/types';
import { vaultBootstrap } from '#shared/api/vault-protocol/vault-bootstrap';

export const readRecoveryUpgradeBootstrap = async (
  context: VaultSessionContext,
  signal: AbortSignal,
  assertCurrent: () => void,
): Promise<AvailableVaultBootstrapMetadata> => {
  const bootstrap = await vaultBootstrap.get(signal);
  assertCurrent();
  if (
    bootstrap.status !== 'available' ||
    bootstrap.vaultId !== context.vaultId ||
    bootstrap.keyId !== context.keyId ||
    bootstrap.deviceId !== context.deviceId
  )
    throw new Error('Recovery upgrade unavailable');
  return bootstrap;
};
