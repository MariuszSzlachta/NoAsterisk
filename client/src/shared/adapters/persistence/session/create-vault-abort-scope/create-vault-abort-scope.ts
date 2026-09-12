import { assertVaultSessionCurrent } from '#shared/adapters/persistence/session/assert-vault-session-current';
import type {
  VaultAbortScope,
  VaultAbortSession,
} from '#shared/adapters/persistence/session/create-vault-abort-scope/types';

export const createVaultAbortScope = (
  session: VaultAbortSession,
  timeoutMs: number,
): VaultAbortScope => {
  const generation = session.getGeneration();
  const context = session.requireVaultSyncMaterial().context;
  const controller = new AbortController();
  const unsubscribe = session.subscribe(() => {
    try {
      assertVaultSessionCurrent(session, generation, context);
    } catch {
      controller.abort();
    }
  });
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    assertCurrent: (): void => {
      if (controller.signal.aborted)
        throw new Error('Vault operation was aborted');
      assertVaultSessionCurrent(session, generation, context);
    },
    dispose: (): void => {
      clearTimeout(timeout);
      unsubscribe();
    },
  };
};
