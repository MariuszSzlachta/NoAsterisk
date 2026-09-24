import type { VaultV2RecordEnvelope } from '#shared/adapters/persistence/dexie/vault-v2-database/types';
import type { CreateVaultRecordEnvelopeInput } from '#shared/adapters/persistence/dexie/vault-v2-repository/create-vault-record-envelope/types';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';

export const createVaultRecordEnvelope = async <TRecord extends object>(
  input: CreateVaultRecordEnvelopeInput<TRecord>,
): Promise<VaultV2RecordEnvelope> => {
  const id = input.getId(input.record);
  const encrypted = await vaultProtocol.encryptRecord(
    JSON.stringify(input.record),
    {
      accountId: input.context.accountId,
      workspaceId: input.context.workspaceId,
      vaultId: input.context.vaultId,
      keyId: input.context.keyId,
      collection: input.collection,
      recordId: id,
    },
    input.key,
  );
  return {
    id,
    collection: input.collection,
    header: encrypted.header,
    ciphertext: encrypted.ciphertext,
    updatedAt: Date.now(),
  };
};
