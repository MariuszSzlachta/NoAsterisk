import { useSyncExternalStore } from 'react';
import { useQuery } from '@tanstack/react-query';

import { VAULT_NETWORK_TIMEOUT_MS } from '#features/user-settings/api/constants/vault-network-timeout';
import { API_CONTRACT } from '#features/user-settings/api/constants';
import type { RecoveryBackupAvailability } from '#features/user-settings/model/recovery-backup-upgrade/types';
import { encryptedPersistence } from '#shared/adapters/persistence';
import { assertVaultSessionCurrent } from '#shared/adapters/persistence/session/assert-vault-session-current';
import type { QueryState } from '#shared/api';
import { vaultBootstrap } from '#shared/api/vault-protocol/vault-bootstrap';

export const useRecoveryBackupAvailabilityQuery =
  (): QueryState<RecoveryBackupAvailability> => {
    const snapshot = useSyncExternalStore(
      encryptedPersistence.subscribe,
      encryptedPersistence.getSnapshot,
      encryptedPersistence.getSnapshot,
    );
    const generation = encryptedPersistence.getGeneration();
    const context =
      snapshot.status === 'unlocked'
        ? encryptedPersistence.requireVaultSyncMaterial().context
        : undefined;
    const query = useQuery({
      queryKey: [
        API_CONTRACT.QUERY_KEYS.RECOVERY_BACKUP,
        context?.accountId,
        context?.workspaceId,
        context?.vaultId,
        context?.keyId,
        context?.deviceId,
        generation,
      ],
      enabled: context !== undefined,
      retry: false,
      queryFn: async ({ signal }): Promise<RecoveryBackupAvailability> => {
        if (context === undefined)
          throw new Error('Recovery status unavailable');
        const bootstrap = await vaultBootstrap.get(
          AbortSignal.any([
            signal,
            AbortSignal.timeout(VAULT_NETWORK_TIMEOUT_MS),
          ]),
        );
        assertVaultSessionCurrent(encryptedPersistence, generation, context);
        if (
          bootstrap.status !== 'available' ||
          bootstrap.vaultId !== context.vaultId ||
          bootstrap.keyId !== context.keyId ||
          bootstrap.deviceId !== context.deviceId
        )
          throw new Error('Recovery status unavailable');
        return { isRegistered: bootstrap.recoveryPublicKey !== undefined };
      },
    });
    if (query.isPending)
      return { status: context === undefined ? 'notLoaded' : 'loading' };
    if (query.isError)
      return { status: 'error', error: 'Recovery status unavailable' };
    return { status: 'loaded', data: query.data };
  };
