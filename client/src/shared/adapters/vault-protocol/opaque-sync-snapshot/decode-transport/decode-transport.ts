import { MAX_OPAQUE_SNAPSHOT_TRANSPORT_BYTES } from '#shared/adapters/vault-protocol/opaque-sync-snapshot/constants';

const BASE64_QUANTUM = 4;
const BASE64_ENCODING_RATIO = 4 / 3;
const BASE64_PATTERN =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

export const decodeOpaqueSnapshotTransport = (value: string): string => {
  if (
    value.length >
    Math.ceil(MAX_OPAQUE_SNAPSHOT_TRANSPORT_BYTES * BASE64_ENCODING_RATIO)
  )
    throw new Error('Sync snapshot exceeds protocol limit');
  if (value.length % BASE64_QUANTUM !== 0 || !BASE64_PATTERN.test(value))
    throw new Error('Invalid sync snapshot');
  const decoded = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(decoded.length));
  decoded.split('').forEach((character, index) => {
    bytes[index] = character.charCodeAt(0);
  });
  if (bytes.length > MAX_OPAQUE_SNAPSHOT_TRANSPORT_BYTES)
    throw new Error('Sync snapshot exceeds protocol limit');
  return new TextDecoder().decode(bytes);
};
