import type { SnapshotTransportMetadata } from '#shared/adapters/vault-protocol/assert-snapshot-binding/types';
import { vaultProtocolConstants } from '#shared/adapters/vault-protocol/vault-protocol-constants';
import { vaultProtocolUtils } from '#shared/adapters/vault-protocol/vault-protocol-utils';

export const assertSnapshotBinding = async (
  envelope: unknown,
  metadata: SnapshotTransportMetadata,
): Promise<void> => {
  if (!vaultProtocolUtils.validateSnapshot(envelope))
    throw new Error('Invalid snapshot envelope');
  const header = envelope.header;
  if (
    header.vaultId !== metadata.vaultId ||
    header.keyId !== metadata.keyId ||
    header.createdByDeviceId !== metadata.deviceId ||
    header.revision !== metadata.revision ||
    header.previousEnvelopeHash !== metadata.previousEnvelopeHash ||
    header.createdAt !== metadata.createdAt
  )
    throw new Error('Snapshot transport metadata mismatch');
  const digest = await crypto.subtle.digest(
    vaultProtocolConstants.sha256Algorithm,
    vaultProtocolUtils.asBuffer(
      new TextEncoder().encode(vaultProtocolUtils.canonicalize(envelope)),
    ),
  );
  if (
    vaultProtocolUtils.toBase64(new Uint8Array(digest)) !==
    metadata.envelopeHash
  )
    throw new Error('Snapshot transport hash mismatch');
};
