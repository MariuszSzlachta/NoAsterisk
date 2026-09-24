import { describe, expect, it } from 'vitest';

import { encryptRotationVmk } from '#shared/adapters/persistence/dexie/vault-v2-repository/encrypt-rotation-vmk';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';

describe('encryptRotationVmk', () => {
  it('encrypts the next VMK under the scoped rotation record identity', async () => {
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
    const vmk = new Uint8Array(32).fill(7);
    try {
      const envelope = await encryptRotationVmk(
        vmk,
        {
          accountId: 'account',
          workspaceId: 'workspace',
          vaultId: 'vault',
          keyId: 'key-next',
        },
        key,
      );
      const plaintext = await vaultProtocol.decryptRecord(
        envelope,
        {
          accountId: 'account',
          workspaceId: 'workspace',
          vaultId: 'vault',
          keyId: 'key-next',
          collection: '__vault_rotation__',
          recordId: 'next-vmk',
        },
        key,
      );
      expect(plaintext).toBe(JSON.stringify(Array.from(vmk)));
    } finally {
      vmk.fill(0);
    }
  });
});
