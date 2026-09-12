import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useTrustedDeviceApprovalStore } from '#features/user-settings/store/useTrustedDeviceApprovalStore';
import { createSignedTrustedApproval } from '#features/user-settings/ui/hooks/create-signed-trusted-approval';
import { useTrustedDeviceApproval } from '#features/user-settings/ui/hooks/useTrustedDeviceApproval';
import type { SignedTrustedResponse } from '#shared/adapters/vault-protocol/signed-trusted-enrollment';
import { createSignedTrustedFixture } from '#shared/adapters/vault-protocol/signed-trusted-enrollment/testing/create-signed-trusted-fixture';

const boundary = vi.hoisted(() => ({
  approve: vi.fn<typeof createSignedTrustedApproval>(),
  generation: 0,
  unlocked: true,
  listeners: new Set<() => void>(),
  context: {
    accountId: 'account',
    workspaceId: 'workspace',
    vaultId: 'vault',
    keyId: 'key',
    deviceId: 'approver',
  },
}));
vi.mock(
  '#features/user-settings/ui/hooks/create-signed-trusted-approval',
  () => ({ createSignedTrustedApproval: boundary.approve }),
);
vi.mock('#shared/adapters/persistence', () => ({
  encryptedPersistence: {
    getGeneration: () => boundary.generation,
    isUnlocked: () => boundary.unlocked,
    requireVaultSyncMaterial: () => ({ context: boundary.context }),
    subscribe: (listener: () => void) => {
      boundary.listeners.add(listener);
      return () => boundary.listeners.delete(listener);
    },
  },
}));

describe('useTrustedDeviceApproval', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    boundary.generation = 0;
    boundary.unlocked = true;
    useTrustedDeviceApprovalStore.getState().reset();
  });
  afterEach(() => {
    cleanup();
    boundary.listeners.clear();
  });

  it('requires a same-scope signed request before approval and never echoes scanner input in an error', async () => {
    const fixture = await createSignedTrustedFixture();
    const { result } = renderHook(useTrustedDeviceApproval);
    try {
      act(() => result.current.handleStart());
      act(() =>
        result.current.handleScan(
          JSON.stringify({
            ...fixture.request,
            intent: { ...fixture.request.intent, workspaceId: 'other' },
          }),
        ),
      );
      expect(result.current.data.isScanning).toBe(true);
      expect(result.current.data.error).toBe(
        'settings.vault.trustedDeviceError',
      );
      act(() => result.current.handleScan(JSON.stringify(fixture.request)));
      expect(result.current.data.isConfirming).toBe(true);
      expect(result.current.data.error).toBeUndefined();
      expect(boundary.approve).not.toHaveBeenCalled();
      act(() => result.current.handleCancel());
      act(() => result.current.handleScanError('private-scanner-input'));
      expect(result.current.data.isIdle).toBe(true);
      expect(result.current.data.error).toBeUndefined();
    } finally {
      fixture.vmk.fill(0);
    }
  });

  it.each(['cancel', 'lock', 'generation', 'unmount'])(
    'discards a delayed response after %s and does not duplicate approval',
    async (invalidation) => {
      const fixture = await createSignedTrustedFixture();
      const completion = {
        resolve: (_response: SignedTrustedResponse): void => {
          throw new Error('Deferred approval uninitialized');
        },
      };
      const pending = new Promise<SignedTrustedResponse>((resolve) => {
        completion.resolve = resolve;
      });
      boundary.approve.mockReturnValue(pending);
      const { result, unmount } = renderHook(useTrustedDeviceApproval);
      try {
        act(() => result.current.handleStart());
        act(() => result.current.handleScan(JSON.stringify(fixture.request)));
        act(() => {
          result.current.handleApprove();
          result.current.handleApprove();
        });
        expect(result.current.data.isGenerating).toBe(true);
        expect(boundary.approve).toHaveBeenCalledOnce();
        act(() => {
          if (invalidation === 'cancel') result.current.handleCancel();
          else if (invalidation === 'unmount') unmount();
          else {
            if (invalidation === 'lock') boundary.unlocked = false;
            else boundary.generation += 1;
            boundary.listeners.forEach((listener) => listener());
          }
        });
        await act(async () => {
          completion.resolve(fixture.response);
          await pending;
        });
        expect(useTrustedDeviceApprovalStore.getState().phase).toEqual({
          kind: 'idle',
        });
        expect(useTrustedDeviceApprovalStore.getState().error).toBeUndefined();
      } finally {
        fixture.vmk.fill(0);
      }
    },
  );
});
