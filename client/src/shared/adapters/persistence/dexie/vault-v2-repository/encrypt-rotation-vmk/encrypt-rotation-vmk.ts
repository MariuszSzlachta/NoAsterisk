import { createRotationRecordContext } from '#shared/adapters/persistence/dexie/vault-v2-repository/create-rotation-record-context';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';

interface RotationContext {
  readonly accountId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly keyId: string;
}

export const encryptRotationVmk = async (
  vmk: Uint8Array,
  context: RotationContext,
  key: CryptoKey,
): Promise<{
  readonly header: Record<string, unknown>;
  readonly ciphertext: string;
}> => {
  const envelope = await vaultProtocol.encryptRecord(
    JSON.stringify(Array.from(vmk)),
    createRotationRecordContext(context, '__vault_rotation__', 'next-vmk'),
    key,
  );
  return { header: envelope.header, ciphertext: envelope.ciphertext };
};
