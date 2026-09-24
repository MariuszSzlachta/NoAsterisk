import { describe, expect, it } from 'vitest';

import { createVaultRecordEnvelope } from '#shared/adapters/persistence/dexie/vault-v2-repository/create-vault-record-envelope';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';

describe('createVaultRecordEnvelope', () => {
  it('encrypts a record with its exact scoped record context', async () => {
    const context = {
      accountId: 'account',
      workspaceId: 'workspace',
      vaultId: 'vault',
      keyId: 'key',
      deviceId: 'device',
    };
    const vmk = vaultProtocol.generateVmk();
    try {
      const keys = await vaultProtocol.deriveKeys(vmk, context);
      const envelope = await createVaultRecordEnvelope({
        collection: 'transactions',
        record: { id: 'record', amount: 12 },
        getId: (record): string => String(record.id),
        key: keys.local,
        context,
      });

      expect(envelope.id).toBe('record');
      expect(envelope.collection).toBe('transactions');
      await expect(
        vaultProtocol.decryptRecord(
          { header: envelope.header, ciphertext: envelope.ciphertext },
          {
            ...context,
            collection: 'transactions',
            recordId: 'record',
          },
          keys.local,
        ),
      ).resolves.toBe('{"id":"record","amount":12}');
    } finally {
      vmk.fill(0);
    }
  });
});
