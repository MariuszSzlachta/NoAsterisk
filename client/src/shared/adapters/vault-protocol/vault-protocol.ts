import { vaultProtocolConstants } from '#shared/adapters/vault-protocol/vault-protocol-constants';
import { vaultProtocolUtils } from '#shared/adapters/vault-protocol/vault-protocol-utils';

interface VaultContext {
  readonly accountId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly keyId: string;
}
interface RecordContext extends VaultContext {
  readonly collection: string;
  readonly recordId: string;
}
interface SnapshotHeader extends VaultContext {
  readonly formatVersion: 2;
  readonly cryptoSuite: 'HKDF-SHA256/AES-256-GCM';
  readonly revision: number;
  readonly previousEnvelopeHash: string;
  readonly createdByDeviceId: string;
  readonly createdAt: string;
  readonly nonce: string;
}
interface EncryptedEnvelope {
  readonly header: Record<string, unknown>;
  readonly ciphertext: string;
}
interface SnapshotEnvelope {
  readonly header: SnapshotHeader;
  readonly ciphertext: string;
  readonly signature: string;
}
interface WrapContext extends VaultContext {
  readonly deviceId: string;
  readonly credentialId?: string;
}
interface VmkEnvelope {
  readonly header: Record<string, unknown>;
  readonly ciphertext: string;
}
interface VaultProtocol {
  readonly generateVmk: () => Uint8Array;
  readonly deriveKeys: (
    vmk: Uint8Array,
    context: VaultContext,
  ) => Promise<{
    readonly local: CryptoKey;
    readonly sync: CryptoKey;
    readonly check: CryptoKey;
  }>;
  readonly deriveDeviceKey: (
    localShare: CryptoKey,
    serverShare: Uint8Array,
    context: WrapContext,
  ) => Promise<CryptoKey>;
  readonly generateLocalShare: () => Promise<CryptoKey>;
  readonly importPrfOutput: (prfOutput: Uint8Array) => Promise<CryptoKey>;
  readonly derivePrfKey: (
    prfOutput: CryptoKey,
    serverShare: Uint8Array,
    context: WrapContext,
  ) => Promise<CryptoKey>;
  readonly wrapVmk: (
    vmk: Uint8Array,
    wrappingKey: CryptoKey,
    context: WrapContext,
    purpose: string,
  ) => Promise<VmkEnvelope>;
  readonly unwrapVmk: (
    envelope: unknown,
    wrappingKey: CryptoKey,
    context: WrapContext,
    purpose: string,
  ) => Promise<Uint8Array>;
  readonly encryptRecord: (
    plaintext: string,
    context: RecordContext,
    key: CryptoKey,
  ) => Promise<EncryptedEnvelope>;
  readonly decryptRecord: (
    envelope: unknown,
    context: RecordContext,
    key: CryptoKey,
  ) => Promise<string>;
  readonly createSentinel: (
    context: VaultContext,
    key: CryptoKey,
  ) => Promise<EncryptedEnvelope>;
  readonly verifySentinel: (
    sentinel: unknown,
    context: VaultContext,
    key: CryptoKey,
  ) => Promise<void>;
  readonly createSnapshot: (
    plaintext: string,
    header: SnapshotHeader,
    key: CryptoKey,
    signingKey: CryptoKey,
  ) => Promise<SnapshotEnvelope>;
  readonly decryptSnapshot: (
    envelope: unknown,
    context: VaultContext,
    key: CryptoKey,
    verifyKey: CryptoKey,
  ) => Promise<string>;
  readonly hashEnvelope: (envelope: SnapshotEnvelope) => Promise<string>;
  readonly assertFreshSnapshot: (
    envelope: unknown,
    highWaterRevision: number,
    highWaterHash: string | undefined,
  ) => Promise<void>;
  readonly canonicalize: (value: unknown) => string;
  readonly composeAad: (context: RecordContext | SnapshotHeader) => Uint8Array;
}

const createVaultProtocol = (): VaultProtocol => ({
  generateVmk: (): Uint8Array =>
    crypto.getRandomValues(new Uint8Array(vaultProtocolConstants.vmkLength)),
  deriveKeys: async (vmk, context) => {
    if (vmk.length !== vaultProtocolConstants.vmkLength)
      throw new Error('VMK must contain 32 bytes');
    return {
      local: await vaultProtocolUtils.derivePurposeKey(
        vmk,
        context.vaultId,
        vaultProtocolConstants.localLabel,
      ),
      sync: await vaultProtocolUtils.derivePurposeKey(
        vmk,
        context.vaultId,
        vaultProtocolConstants.syncLabel,
      ),
      check: await vaultProtocolUtils.derivePurposeKey(
        vmk,
        context.vaultId,
        vaultProtocolConstants.checkLabel,
      ),
    };
  },
  deriveDeviceKey: async (localShare, serverShare, context) => {
    vaultProtocolUtils.assertShare(serverShare, 'ServerShare');
    const info = vaultProtocolUtils.canonicalize({
      domain: vaultProtocolConstants.deviceLabel,
      accountId: context.accountId,
      workspaceId: context.workspaceId,
      vaultId: context.vaultId,
      keyId: context.keyId,
      deviceId: context.deviceId,
    });
    return vaultProtocolUtils.deriveHkdfAesKey(
      localShare,
      serverShare,
      new TextEncoder().encode(info),
    );
  },
  generateLocalShare: async () => {
    const material = crypto.getRandomValues(
      new Uint8Array(vaultProtocolConstants.maxShareLength),
    );
    try {
      return await vaultProtocolUtils.importHkdfKey(material);
    } finally {
      material.fill(0);
    }
  },
  importPrfOutput: async (prfOutput) => {
    vaultProtocolUtils.assertShare(prfOutput, 'PRF output');
    try {
      return await vaultProtocolUtils.importHkdfKey(prfOutput);
    } finally {
      prfOutput.fill(0);
    }
  },
  derivePrfKey: async (prfOutput, serverShare, context) => {
    vaultProtocolUtils.assertShare(serverShare, 'ServerShare');
    const info = vaultProtocolUtils.canonicalize({
      domain: vaultProtocolConstants.passkeyLabel,
      accountId: context.accountId,
      workspaceId: context.workspaceId,
      vaultId: context.vaultId,
      keyId: context.keyId,
      deviceId: context.deviceId,
      credentialId: context.credentialId ?? '',
    });
    return vaultProtocolUtils.deriveHkdfAesKey(
      prfOutput,
      serverShare,
      new TextEncoder().encode(info),
    );
  },
  wrapVmk: async (vmk, wrappingKey, context, purpose) => {
    if (vmk.length !== vaultProtocolConstants.vmkLength)
      throw new Error('VMK must contain 32 bytes');
    const header = {
      formatVersion: vaultProtocolConstants.vmkEnvelopeVersion,
      cryptoSuite: vaultProtocolConstants.cryptoSuite,
      purpose,
      accountId: context.accountId,
      workspaceId: context.workspaceId,
      vaultId: context.vaultId,
      keyId: context.keyId,
      deviceId: context.deviceId,
      credentialId: context.credentialId ?? '',
      nonce: vaultProtocolUtils.toBase64(
        crypto.getRandomValues(
          new Uint8Array(vaultProtocolConstants.nonceLength),
        ),
      ),
    };
    const encrypted = await vaultProtocolUtils.encrypt(
      vaultProtocolUtils.toBase64(vmk),
      vaultProtocolUtils.composeAad(header),
      wrappingKey,
      vaultProtocolUtils.fromBase64(header.nonce),
    );
    return { header, ciphertext: encrypted.ciphertext };
  },
  unwrapVmk: async (envelope, wrappingKey, context, purpose) => {
    if (!vaultProtocolUtils.validateWrapEnvelope(envelope))
      throw new Error('Invalid VMK envelope');
    if (
      envelope.header.purpose !== purpose ||
      envelope.header.accountId !== context.accountId ||
      envelope.header.workspaceId !== context.workspaceId ||
      envelope.header.vaultId !== context.vaultId ||
      envelope.header.keyId !== context.keyId ||
      envelope.header.deviceId !== context.deviceId ||
      envelope.header.credentialId !== (context.credentialId ?? '')
    )
      throw new Error('VMK envelope context mismatch');
    const plaintext = await vaultProtocolUtils.decrypt(
      envelope.ciphertext,
      vaultProtocolUtils.getString(envelope.header, 'nonce'),
      vaultProtocolUtils.composeAad(envelope.header),
      wrappingKey,
    );
    const vmk = vaultProtocolUtils.fromBase64(plaintext);
    if (vmk.length !== vaultProtocolConstants.vmkLength)
      throw new Error('Invalid VMK envelope payload');
    return vmk;
  },
  encryptRecord: async (plaintext, context, key) => {
    const envelope = await vaultProtocolUtils.encrypt(
      plaintext,
      vaultProtocolUtils.composeAad(context),
      key,
    );
    return { ...envelope, header: { ...envelope.header, ...context } };
  },
  decryptRecord: async (envelope, context, key) => {
    if (
      !vaultProtocolUtils.validateEnvelope(envelope) ||
      !vaultProtocolUtils.isRecord(envelope.header) ||
      envelope.header.collection !== context.collection ||
      envelope.header.recordId !== context.recordId
    )
      throw new Error('Invalid record envelope');
    vaultProtocolUtils.assertContext(envelope.header, context);
    return vaultProtocolUtils.decrypt(
      envelope.ciphertext,
      vaultProtocolUtils.getString(envelope.header, 'nonce'),
      vaultProtocolUtils.composeAad(context),
      key,
    );
  },
  createSentinel: async (context, key) =>
    vaultProtocolUtils
      .encrypt(
        JSON.stringify({ value: vaultProtocolConstants.sentinelValue }),
        vaultProtocolUtils.composeAad({
          ...context,
          collection: 'sentinel',
          recordId: 'key-check',
        }),
        key,
      )
      .then((envelope) => ({
        ...envelope,
        header: {
          ...envelope.header,
          ...context,
          collection: 'sentinel',
          recordId: 'key-check',
        },
      })),
  verifySentinel: async (sentinel, context, key) => {
    if (!vaultProtocolUtils.validateEnvelope(sentinel))
      throw new Error('Invalid sentinel envelope');
    if (
      !vaultProtocolUtils.isRecord(sentinel.header) ||
      sentinel.header.collection !== 'sentinel' ||
      sentinel.header.recordId !== 'key-check'
    )
      throw new Error('Invalid sentinel envelope');
    vaultProtocolUtils.assertContext(sentinel.header, context);
    const plaintext = await vaultProtocolUtils.decrypt(
      sentinel.ciphertext,
      vaultProtocolUtils.getString(sentinel.header, 'nonce'),
      vaultProtocolUtils.composeAad({
        ...context,
        collection: 'sentinel',
        recordId: 'key-check',
      }),
      key,
    );
    if (
      plaintext !==
      JSON.stringify({ value: vaultProtocolConstants.sentinelValue })
    )
      throw new Error('Vault key confirmation failed');
  },
  createSnapshot: async (plaintext, header, key, signingKey) => {
    const nonce = crypto.getRandomValues(
      new Uint8Array(vaultProtocolConstants.nonceLength),
    );
    const snapshotHeader = {
      ...header,
      nonce: vaultProtocolUtils.toBase64(nonce),
    };
    const encrypted = await vaultProtocolUtils.encrypt(
      plaintext,
      vaultProtocolUtils.composeAad(snapshotHeader),
      key,
      nonce,
    );
    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: vaultProtocolConstants.sha256Algorithm },
      signingKey,
      vaultProtocolUtils.asBuffer(
        vaultProtocolUtils.createSignaturePayload(
          snapshotHeader,
          encrypted.ciphertext,
        ),
      ),
    );
    const snapshot = {
      header: snapshotHeader,
      ciphertext: encrypted.ciphertext,
      signature: vaultProtocolUtils.toBase64(new Uint8Array(signature)),
    };
    if (
      new TextEncoder().encode(vaultProtocolUtils.canonicalize(snapshot))
        .length > vaultProtocolConstants.maxSnapshotBytes
    )
      throw new Error('Snapshot exceeds protocol limit');
    return snapshot;
  },
  decryptSnapshot: async (envelope, context, key, verifyKey) => {
    if (!vaultProtocolUtils.validateSnapshot(envelope))
      throw new Error('Invalid snapshot envelope');
    vaultProtocolUtils.assertContext(envelope.header, context);
    const valid = await crypto.subtle.verify(
      { name: 'ECDSA', hash: vaultProtocolConstants.sha256Algorithm },
      verifyKey,
      vaultProtocolUtils.asBuffer(
        vaultProtocolUtils.fromBase64(envelope.signature),
      ),
      vaultProtocolUtils.asBuffer(
        vaultProtocolUtils.createSignaturePayload(
          envelope.header,
          envelope.ciphertext,
        ),
      ),
    );
    if (!valid) throw new Error('Snapshot signature verification failed');
    return vaultProtocolUtils.decrypt(
      envelope.ciphertext,
      vaultProtocolUtils.getString(envelope.header, 'nonce'),
      vaultProtocolUtils.composeAad(envelope.header),
      key,
    );
  },
  hashEnvelope: async (envelope) =>
    vaultProtocolUtils.toBase64(
      new Uint8Array(
        await crypto.subtle.digest(
          vaultProtocolConstants.sha256Algorithm,
          vaultProtocolUtils.asBuffer(
            new TextEncoder().encode(vaultProtocolUtils.canonicalize(envelope)),
          ),
        ),
      ),
    ),
  assertFreshSnapshot: async (envelope, highWaterRevision, highWaterHash) => {
    if (!vaultProtocolUtils.validateSnapshot(envelope))
      throw new Error('Invalid snapshot envelope');
    const revision = envelope.header.revision;
    if (typeof revision !== 'number') throw new Error('Invalid snapshot revision');
    if (revision < highWaterRevision)
      throw new Error('Snapshot rollback detected');
    if (
      revision === highWaterRevision &&
      highWaterHash !== undefined &&
      (await vaultProtocolUtils.toBase64(
        new Uint8Array(
          await crypto.subtle.digest(
            vaultProtocolConstants.sha256Algorithm,
            vaultProtocolUtils.asBuffer(
              new TextEncoder().encode(
                vaultProtocolUtils.canonicalize(envelope),
              ),
            ),
          ),
        ),
      )) !== highWaterHash
    )
      throw new Error('Snapshot replay detected');
    if (
      revision > highWaterRevision &&
      highWaterHash !== undefined &&
      envelope.header.previousEnvelopeHash !== highWaterHash
    )
      throw new Error('Snapshot chain mismatch');
  },
  canonicalize: vaultProtocolUtils.canonicalize,
  composeAad: vaultProtocolUtils.composeAad,
});

export const vaultProtocol: VaultProtocol = createVaultProtocol();
