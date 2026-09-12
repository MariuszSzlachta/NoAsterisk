import { createElement, type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useRecoveryBackupAvailabilityQuery } from '#features/user-settings/api/useRecoveryBackupAvailabilityQuery';
import { encryptedPersistence } from '#shared/adapters/persistence';
import { apiClient } from '#shared/api';
import { vaultDeviceId } from '#shared/api/vault-protocol/device-id';
import { buildVaultBootstrapMetadata } from '#shared/api/vault-protocol/get-vault-bootstrap/testing/build-vault-bootstrap-metadata';

const boundary = vi.hoisted(() => ({
  snapshot: vi.fn<typeof encryptedPersistence.getSnapshot>(),
  subscribe: vi.fn<typeof encryptedPersistence.subscribe>(),
  material: vi.fn<typeof encryptedPersistence.requireVaultSyncMaterial>(),
  generation: vi.fn(() => 5),
  unlocked: vi.fn(() => true),
}));
vi.mock('#shared/adapters/persistence', () => ({
  encryptedPersistence: {
    getSnapshot: boundary.snapshot,
    subscribe: boundary.subscribe,
    requireVaultSyncMaterial: boundary.material,
    getGeneration: boundary.generation,
    isUnlocked: boundary.unlocked,
  },
}));
beforeEach(() => {
  vi.resetAllMocks();
  boundary.generation.mockReturnValue(5);
  boundary.unlocked.mockReturnValue(true);
  boundary.subscribe.mockReturnValue(() => {});
  boundary.snapshot.mockReturnValue({
    status: 'unlocked',
    error: undefined,
    warning: undefined,
    storage: 'unknown',
  });
});
afterEach(() => vi.restoreAllMocks());
describe('useRecoveryBackupAvailabilityQuery', () => {
  it.each(['missing', 'registered', 'foreign'])(
    'should expose only scoped recovery availability; response=%s',
    async (result) => {
      const context = {
        accountId: 'account',
        workspaceId: 'workspace',
        vaultId: 'vault',
        keyId: 'key',
        deviceId: vaultDeviceId.get(),
      };
      const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt'],
      );
      boundary.material.mockReturnValue({
        context,
        syncKey: key,
        signingKey: key,
        verifyKey: key,
      });
      vi.spyOn(apiClient, 'get').mockResolvedValue(
        buildVaultBootstrapMetadata({
          vaultId: result === 'foreign' ? 'foreign' : context.vaultId,
          keyId: context.keyId,
          deviceId: context.deviceId,
          recoveryPublicKey:
            result === 'registered' ? 'a'.repeat(64) : undefined,
        }),
      );
      const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      const wrapper = ({ children }: PropsWithChildren): React.JSX.Element =>
        createElement(QueryClientProvider, { client }, children);
      const hook = renderHook(useRecoveryBackupAvailabilityQuery, { wrapper });
      await waitFor(() =>
        expect(hook.result.current.status).toBe(
          result === 'foreign' ? 'error' : 'loaded',
        ),
      );
      if (result !== 'foreign')
        expect(hook.result.current).toEqual({
          status: 'loaded',
          data: { isRegistered: result === 'registered' },
        });
      hook.unmount();
      client.clear();
    },
  );
});
