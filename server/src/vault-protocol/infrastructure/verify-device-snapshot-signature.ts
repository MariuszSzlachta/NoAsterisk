import { webcrypto } from 'node:crypto';

const SIGNATURE_DOMAIN = 'budgetflow/snapshot-signature/v2';
const SNAPSHOT_HEADER_KEYS = [
  'accountId',
  'workspaceId',
  'vaultId',
  'keyId',
  'formatVersion',
  'cryptoSuite',
  'revision',
  'previousEnvelopeHash',
  'createdByDeviceId',
  'createdAt',
  'nonce',
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const sortedValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortedValue);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortedValue(value[key])]),
  );
};

const canonicalize = (value: unknown): string =>
  JSON.stringify(sortedValue(value));

const isPublicJwk = (value: unknown): value is JsonWebKey =>
  isRecord(value) &&
  value.kty === 'EC' &&
  value.crv === 'P-256' &&
  typeof value.x === 'string' &&
  typeof value.y === 'string' &&
  !('d' in value);

const decodeBase64 = (value: string): Uint8Array<ArrayBuffer> => {
  if (
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      value,
    )
  )
    throw new Error('Invalid snapshot signature');
  return new Uint8Array(Buffer.from(value, 'base64'));
};

const isExpectedHeader = (
  value: unknown,
  snapshot: {
    readonly vaultId: string;
    readonly keyId: string;
    readonly deviceId: string;
    readonly revision: number;
    readonly previousEnvelopeHash: string;
  },
): value is Record<string, unknown> => {
  if (!isRecord(value)) return false;
  if (
    Object.keys(value).length !== SNAPSHOT_HEADER_KEYS.length ||
    !SNAPSHOT_HEADER_KEYS.every((key) => key in value)
  )
    return false;
  return (
    value.formatVersion === 2 &&
    value.cryptoSuite === 'HKDF-SHA256/AES-256-GCM' &&
    value.vaultId === snapshot.vaultId &&
    value.keyId === snapshot.keyId &&
    value.createdByDeviceId === snapshot.deviceId &&
    value.revision === snapshot.revision &&
    value.previousEnvelopeHash === snapshot.previousEnvelopeHash &&
    typeof value.accountId === 'string' &&
    typeof value.workspaceId === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.nonce === 'string'
  );
};

const verifyDeviceSnapshotSignature = async (input: {
  readonly signingPublicKey: string | null;
  readonly accountId: string;
  readonly workspaceId: string;
  readonly snapshot: {
    readonly vaultId: string;
    readonly keyId: string;
    readonly deviceId: string;
    readonly revision: number;
    readonly previousEnvelopeHash: string;
    readonly header: string;
    readonly ciphertext: string;
    readonly signature: string;
  };
}): Promise<boolean> => {
  try {
    if (input.signingPublicKey === null) return false;
    const publicKey: unknown = JSON.parse(input.signingPublicKey);
    const header: unknown = JSON.parse(input.snapshot.header);
    if (!isPublicJwk(publicKey)) return false;
    if (!isExpectedHeader(header, input.snapshot)) return false;
    if (
      header.accountId !== input.accountId ||
      header.workspaceId !== input.workspaceId
    )
      return false;
    const signature = decodeBase64(input.snapshot.signature);
    if (signature.length === 0 || signature.length > 4_000) return false;
    const payload = new TextEncoder().encode(
      `${SIGNATURE_DOMAIN}|${canonicalize(header)}|${input.snapshot.ciphertext}`,
    );
    const key = await webcrypto.subtle.importKey(
      'jwk',
      publicKey,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify'],
    );
    return await webcrypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      signature,
      payload,
    );
  } catch {
    return false;
  }
};

export const deviceSnapshotSignature = Object.freeze({
  verify: verifyDeviceSnapshotSignature,
});
