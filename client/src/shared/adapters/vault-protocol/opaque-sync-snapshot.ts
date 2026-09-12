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
  readonly envelopeHash: string;
}

const MAX_TRANSPORT_BYTES = 6_000_000;

const encodeTransport = (value: string): string => {
  const bytes = new TextEncoder().encode(value);
  if (bytes.length > MAX_TRANSPORT_BYTES) throw new Error('Sync snapshot exceeds protocol limit');
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const decodeTransport = (value: string): string => {
  if (value.length > Math.ceil((MAX_TRANSPORT_BYTES * 4) / 3))
    throw new Error('Sync snapshot exceeds protocol limit');
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))
    throw new Error('Invalid sync snapshot');
  const decoded = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(decoded.length));
  decoded.split('').forEach((character, index) => {
    bytes[index] = character.charCodeAt(0);
  });
  if (bytes.length > MAX_TRANSPORT_BYTES) throw new Error('Sync snapshot exceeds protocol limit');
  return new TextDecoder().decode(bytes);
};

const create = async (input: SyncSnapshotInput): Promise<{
  readonly transport: string;
  readonly envelope: Awaited<ReturnType<typeof vaultProtocol.createSnapshot>>;
  readonly state: SyncSnapshotState;
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
    transport: encodeTransport(JSON.stringify(envelope)),
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
  const parsed: unknown = JSON.parse(decodeTransport(transport));
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('header' in parsed) ||
    !('ciphertext' in parsed) ||
    !('signature' in parsed)
  )
    throw new Error('Invalid sync snapshot');
  await vaultProtocol.assertFreshSnapshot(parsed, state.revision, state.envelopeHash);
  return vaultProtocol.decryptSnapshot(parsed, context, syncKey, verifyKey);
};

const openEnvelope = async (
  envelope: unknown,
  context: Omit<SnapshotContext, 'deviceId'>,
  syncKey: CryptoKey,
  verifyKey: CryptoKey,
  state: SyncSnapshotState,
): Promise<string> => {
  await vaultProtocol.assertFreshSnapshot(envelope, state.revision, state.envelopeHash);
  return vaultProtocol.decryptSnapshot(envelope, context, syncKey, verifyKey);
};

export const opaqueSyncSnapshot = Object.freeze({ create, open, openEnvelope });
