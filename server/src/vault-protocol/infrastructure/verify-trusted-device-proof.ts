import { webcrypto } from 'node:crypto';

const DOMAIN = 'budgetflow/trusted-device-qr/v1';
const KIND = 'budgetflow/trusted-device-qr';
const FORMAT_VERSION = 1;
const MAX_ID_LENGTH = 128;
const MAX_CIPHERTEXT_LENGTH = 44_000;
const MAX_SIGNATURE_LENGTH = 512;

interface TrustedDeviceProofContext {
  readonly accountId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly keyId: string;
  readonly oldDeviceId: string;
  readonly newDeviceId: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isId = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length > 0 &&
  value.length <= MAX_ID_LENGTH;

const isPublicJwk = (value: unknown): value is JsonWebKey =>
  isRecord(value) &&
  value.kty === 'EC' &&
  value.crv === 'P-256' &&
  typeof value.x === 'string' &&
  typeof value.y === 'string' &&
  !('d' in value);

const canonicalize = (value: unknown): string => {
  const sorted = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(sorted);
    if (!isRecord(item)) return item;
    return Object.fromEntries(
      Object.keys(item)
        .sort()
        .map((key) => [key, sorted(item[key])]),
    );
  };
  return JSON.stringify(sorted(value));
};

const decodeBase64 = (value: unknown, maxBytes: number): Uint8Array => {
  if (
    typeof value !== 'string' ||
    value.length > Math.ceil((maxBytes * 4) / 3) ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      value,
    )
  )
    throw new Error('Invalid trusted-device proof');
  const bytes = new Uint8Array(Buffer.from(value, 'base64'));
  if (bytes.length > maxBytes) throw new Error('Invalid trusted-device proof');
  return bytes;
};

const verify = async (input: {
  readonly proof: string;
  readonly context: TrustedDeviceProofContext;
  readonly expectedSigningPublicKey: string;
}): Promise<boolean> => {
  try {
    if (input.proof.length > 64_000) return false;
    const proof: unknown = JSON.parse(input.proof);
    if (
      !isRecord(proof) ||
      Object.keys(proof).length !== 14 ||
      proof.formatVersion !== FORMAT_VERSION ||
      proof.kind !== KIND ||
      !isId(proof.accountId) ||
      !isId(proof.workspaceId) ||
      !isId(proof.vaultId) ||
      !isId(proof.keyId) ||
      !isId(proof.oldDeviceId) ||
      !isId(proof.newDeviceId) ||
      !isId(proof.requestId) ||
      !isPublicJwk(proof.oldEphemeralPublicKey) ||
      !isPublicJwk(proof.signingPublicKey) ||
      typeof proof.nonce !== 'string' ||
      typeof proof.ciphertext !== 'string' ||
      typeof proof.signature !== 'string'
    )
      return false;
    const expectedKey: unknown = JSON.parse(input.expectedSigningPublicKey);
    if (
      !isPublicJwk(expectedKey) ||
      canonicalize(expectedKey) !== canonicalize(proof.signingPublicKey) ||
      proof.accountId !== input.context.accountId ||
      proof.workspaceId !== input.context.workspaceId ||
      proof.vaultId !== input.context.vaultId ||
      proof.keyId !== input.context.keyId ||
      proof.oldDeviceId !== input.context.oldDeviceId ||
      proof.newDeviceId !== input.context.newDeviceId
    )
      return false;
    const nonce = decodeBase64(proof.nonce, 12);
    if (nonce.length !== 12) return false;
    const ciphertext = decodeBase64(proof.ciphertext, 32_768);
    if (ciphertext.length < 16) return false;
    const signature = decodeBase64(proof.signature, 384);
    if (
      signature.length === 0 ||
      proof.ciphertext.length > MAX_CIPHERTEXT_LENGTH ||
      proof.signature.length > MAX_SIGNATURE_LENGTH
    )
      return false;
    const publicKey = await webcrypto.subtle.importKey(
      'jwk',
      expectedKey,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify'],
    );
    const payload = canonicalize({
      domain: DOMAIN,
      formatVersion: proof.formatVersion,
      kind: proof.kind,
      requestId: proof.requestId,
      accountId: proof.accountId,
      workspaceId: proof.workspaceId,
      vaultId: proof.vaultId,
      keyId: proof.keyId,
      oldDeviceId: proof.oldDeviceId,
      newDeviceId: proof.newDeviceId,
      oldEphemeralPublicKey: proof.oldEphemeralPublicKey,
      signingPublicKey: proof.signingPublicKey,
      nonce: proof.nonce,
      ciphertext: proof.ciphertext,
    });
    return await webcrypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      signature,
      new TextEncoder().encode(payload),
    );
  } catch {
    return false;
  }
};

export const trustedDeviceProof = Object.freeze({ verify });
