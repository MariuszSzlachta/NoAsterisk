import { afterEach, describe, expect, it, vi } from 'vitest';

import { createVaultAbortScope } from '#shared/adapters/persistence/session/create-vault-abort-scope';
import type { VaultAbortSession } from '#shared/adapters/persistence/session/create-vault-abort-scope/types';

const buildSession = (
  overrides: Partial<VaultAbortSession> = {},
): VaultAbortSession => ({
  isUnlocked: () => true,
  getGeneration: () => 1,
  requireVaultSyncMaterial: () => ({
    context: {
      accountId: 'test',
      workspaceId: 'test',
      vaultId: 'test',
      keyId: 'test',
      deviceId: 'test',
    },
  }),
  subscribe: () => () => undefined,
  ...overrides,
});
afterEach(() => vi.useRealTimers());

describe('createVaultAbortScope', () => {
  it('should abort the request when its timeout expires', () => {
    vi.useFakeTimers();
    const scope = createVaultAbortScope(buildSession(), 100);
    expect(scope.signal.aborted).toBe(false);
    vi.advanceTimersByTime(100);
    expect(scope.signal.aborted).toBe(true);
    expect(scope.assertCurrent).toThrow('aborted');
    scope.dispose();
  });
  it('should abort the request when the central session locks', () => {
    let notify: (() => void) | undefined;
    let unlocked = true;
    const scope = createVaultAbortScope(
      buildSession({
        isUnlocked: () => unlocked,
        subscribe: (listener) => {
          notify = listener;
          return () => undefined;
        },
      }),
      1000,
    );
    unlocked = false;
    notify?.();
    expect(scope.signal.aborted).toBe(true);
    scope.dispose();
  });
  it('should unsubscribe and cancel the timer when the operation finishes', () => {
    vi.useFakeTimers();
    const unsubscribe = vi.fn();
    const scope = createVaultAbortScope(
      buildSession({ subscribe: () => unsubscribe }),
      100,
    );
    scope.dispose();
    vi.advanceTimersByTime(100);
    expect(scope.signal.aborted).toBe(false);
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
