import { describe, expect, it, vi } from 'vitest';
import { encryptedPersistence } from '#shared/adapters/persistence';
import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import { trustedDeviceEnrollment } from '#shared/adapters/vault-protocol/trusted-device-enrollment';
import { trustedDeviceTransfer } from '#shared/adapters/vault-protocol/trusted-device-transfer';

const context = {
  accountId: 'account',
  workspaceId: 'workspace',
  vaultId: 'vault',
  keyId: 'key',
  oldDeviceId: 'old-device',
  newDeviceId: 'new-device',
};

describe('trustedDeviceTransfer', () => {
  it('does not expose the session VMK after creating an approval', async () => {
    const signing = await deviceSigningKey.generate();
    const vmk = new Uint8Array(32).fill(4);
    const getMaterial = vi
      .spyOn(encryptedPersistence, 'getVaultTransferMaterial')
      .mockReturnValue({
        vmk,
        signingKey: signing.privateKey,
        signingPublicKey: signing.publicKey,
      });
    const request = await trustedDeviceEnrollment.createRequest(context);
    const response = await trustedDeviceTransfer.createApproval(
      request.request,
      context,
    );
    expect(response.ciphertext).not.toContain('040404');
    expect(vmk).toEqual(new Uint8Array(32).fill(0));
    getMaterial.mockRestore();
  });
});
