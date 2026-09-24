import type {
  RotationContext,
  RotationRecordContext,
} from '#shared/adapters/persistence/dexie/vault-v2-repository/create-rotation-record-context/types';

export const createRotationRecordContext = (
  context: RotationContext,
  collection: string,
  recordId: string,
): RotationRecordContext => ({
  accountId: context.accountId,
  workspaceId: context.workspaceId,
  vaultId: context.vaultId,
  keyId: context.keyId,
  collection,
  recordId,
});
