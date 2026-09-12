import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createSignedTrustedApproval } from '#features/user-settings/ui/hooks/create-signed-trusted-approval';
import { encryptedPersistence } from '#shared/adapters/persistence';
import { restoreSignedTrustedApproval } from '#shared/adapters/vault-protocol/signed-trusted-enrollment/restore-approval';
import { createSignedTrustedFixture } from '#shared/adapters/vault-protocol/signed-trusted-enrollment/testing/create-signed-trusted-fixture';

const boundary = vi.hoisted(() => ({
  generation: 0,
  unlocked: true,
  read: vi.fn<typeof encryptedPersistence.requireVaultSyncMaterial>(),
  transfer: vi.fn<typeof encryptedPersistence.getVaultTransferMaterial>(),
}));
vi.mock('#shared/adapters/persistence', () => ({
  encryptedPersistence: {
    getGeneration: () => boundary.generation,
    isUnlocked: () => boundary.unlocked,
    requireVaultSyncMaterial: boundary.read,
    getVaultTransferMaterial: boundary.transfer,
  },
}));

describe('createSignedTrustedApproval', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    boundary.generation = 0;
    boundary.unlocked = true;
  });
  it('signs both proofs using owned transfer material and clears the VMK copy on success or session invalidation', async () => {
    const fixture = await createSignedTrustedFixture();
    const context = {
      accountId: 'account',
      workspaceId: 'workspace',
      vaultId: 'vault',
      keyId: 'key',
      deviceId: 'approver',
    };
    boundary.read.mockReturnValue({
      context,
      syncKey: fixture.approving.publicKey,
      signingKey: fixture.approving.privateKey,
      verifyKey: fixture.approving.publicKey,
    });
    try {
      for (const invalidate of [false, true]) {
        const owned = fixture.vmk.slice();
        boundary.transfer.mockImplementation(() => {
          if (invalidate) boundary.generation += 1;
          return {
            vmk: owned,
            signingKey: fixture.approving.privateKey,
            signingPublicKey: fixture.approving.publicKey,
          };
        });
        if (invalidate)
          await expect(
            createSignedTrustedApproval(fixture.request),
          ).rejects.toThrow('session changed');
        else {
          const response = await createSignedTrustedApproval(fixture.request);
          const restored = await restoreSignedTrustedApproval(
            response,
            fixture.request,
            fixture.privateKey,
            fixture.approvingPublicKey,
          );
          try {
            expect(restored).toEqual(fixture.vmk);
          } finally {
            restored.fill(0);
          }
        }
        expect(owned).toEqual(new Uint8Array(32));
        expect(fixture.vmk[0]).toBe(42);
      }
    } finally {
      fixture.vmk.fill(0);
    }
  });

  it('does not request any VMK material for a mismatched or expired proposal', async () => {
    const fixture = await createSignedTrustedFixture();
    boundary.read.mockReturnValue({
      context: {
        accountId: 'other',
        workspaceId: 'workspace',
        vaultId: 'vault',
        keyId: 'key',
        deviceId: 'approver',
      },
      syncKey: fixture.approving.publicKey,
      signingKey: fixture.approving.privateKey,
      verifyKey: fixture.approving.publicKey,
    });
    try {
      await expect(
        createSignedTrustedApproval(fixture.request),
      ).rejects.toThrow('context mismatch');
      expect(boundary.transfer).not.toHaveBeenCalled();
    } finally {
      fixture.vmk.fill(0);
    }
  });
});
