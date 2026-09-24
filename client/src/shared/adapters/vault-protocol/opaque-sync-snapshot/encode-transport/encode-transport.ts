import { MAX_OPAQUE_SNAPSHOT_TRANSPORT_BYTES } from '#shared/adapters/vault-protocol/opaque-sync-snapshot/constants';

export const encodeOpaqueSnapshotTransport = (value: string): string => {
  const bytes = new TextEncoder().encode(value);
  if (bytes.length > MAX_OPAQUE_SNAPSHOT_TRANSPORT_BYTES)
    throw new Error('Sync snapshot exceeds protocol limit');
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};
