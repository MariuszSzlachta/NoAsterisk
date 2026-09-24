import { decodeOpaqueSnapshotTransport } from '#shared/adapters/vault-protocol/opaque-sync-snapshot/decode-transport';
import { encodeOpaqueSnapshotTransport } from '#shared/adapters/vault-protocol/opaque-sync-snapshot/encode-transport';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';

interface SnapshotContext {
  readonly accountId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
}

interface SyncSnapshotInput {
  readonly plaintext: string;
  readonly context: SnapshotContext;
  readonly revision: number;
  readonly previousEnvelopeHash: string;
  readonly signingKey: CryptoKey;
  readonly syncKey: CryptoKey;
  readonly createdAt?: string;
}

interface SyncSnapshotState {
  readonly revision: number;
  readonly envelopeHash?: string;
}

const create = async (
  input: SyncSnapshotInput,
): Promise<{
  readonly transport: string;
  readonly envelope: Awaited<ReturnType<typeof vaultProtocol.createSnapshot>>;
  readonly state: { readonly revision: number; readonly envelopeHash: string };
}> => {
  if (!Number.isSafeInteger(input.revision) || input.revision < 1)
    throw new Error('Invalid sync revision');
  const envelope = await vaultProtocol.createSnapshot(
    input.plaintext,
    {
      accountId: input.context.accountId,
      workspaceId: input.context.workspaceId,
      vaultId: input.context.vaultId,
      keyId: input.context.keyId,
      formatVersion: 2,
      cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
      revision: input.revision,
      previousEnvelopeHash: input.previousEnvelopeHash,
      createdByDeviceId: input.context.deviceId,
      createdAt: input.createdAt ?? new Date().toISOString(),
      nonce: '',
    },
    input.syncKey,
    input.signingKey,
  );
  return {
    transport: encodeOpaqueSnapshotTransport(JSON.stringify(envelope)),
    envelope,
    state: {
      revision: envelope.header.revision,
      envelopeHash: await vaultProtocol.hashEnvelope(envelope),
    },
  };
};

const open = async (
  transport: string,
  context: Omit<SnapshotContext, 'deviceId'>,
  syncKey: CryptoKey,
  verifyKey: CryptoKey,
  state: SyncSnapshotState,
): Promise<string> => {
  const parsed: unknown = JSON.parse(decodeOpaqueSnapshotTransport(transport));
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('header' in parsed) ||
    !('ciphertext' in parsed) ||
    !('signature' in parsed)
  )
    throw new Error('Invalid sync snapshot');
  await vaultProtocol.assertFreshSnapshot(
    parsed,
    state.revision,
    state.envelopeHash,
  );
  return vaultProtocol.decryptSnapshot(parsed, context, syncKey, verifyKey);
};

const openEnvelope = async (
  envelope: unknown,
  context: Omit<SnapshotContext, 'deviceId'>,
  syncKey: CryptoKey,
  verifyKey: CryptoKey,
  state: SyncSnapshotState,
): Promise<string> => {
  await vaultProtocol.assertFreshSnapshot(
    envelope,
    state.revision,
    state.envelopeHash,
  );
  return vaultProtocol.decryptSnapshot(envelope, context, syncKey, verifyKey);
};

export const opaqueSyncSnapshot = Object.freeze({ create, open, openEnvelope });
