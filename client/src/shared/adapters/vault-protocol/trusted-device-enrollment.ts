import { vaultProtocolConstants } from '#shared/adapters/vault-protocol/vault-protocol-constants';
import { vaultProtocolUtils } from '#shared/adapters/vault-protocol/vault-protocol-utils';

const literal = <T extends string | number>(value: T): T => value;
const FORMAT_VERSION = literal(1);
const KIND = literal('budgetflow/trusted-device-qr');
const DOMAIN = 'budgetflow/trusted-device-qr/v1';
const MAX_REQUEST_BYTES = 8_192;
const MAX_RESPONSE_BYTES = 32_768;
const MAX_ID_LENGTH = 128;

interface EnrollmentContext {
  readonly accountId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly keyId: string;
  readonly oldDeviceId: string;
  readonly newDeviceId: string;
}

interface TrustedDeviceRequest extends EnrollmentContext {
  readonly formatVersion: typeof FORMAT_VERSION;
  readonly kind: typeof KIND;
  readonly requestId: string;
  readonly newEphemeralPublicKey: JsonWebKey;
}

interface TrustedDeviceResponse extends EnrollmentContext {
  readonly formatVersion: typeof FORMAT_VERSION;
  readonly kind: typeof KIND;
  readonly requestId: string;
  readonly oldEphemeralPublicKey: JsonWebKey;
  readonly signingPublicKey: JsonWebKey;
  readonly nonce: string;
  readonly ciphertext: string;
  readonly signature: string;
}

interface RequestResult {
  readonly request: TrustedDeviceRequest;
  readonly privateKey: CryptoKey;
}

const isBoundId = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= MAX_ID_LENGTH;

const assertContext = (context: EnrollmentContext): void => {
  for (const value of Object.values(context)) {
    if (!isBoundId(value)) throw new Error('Invalid enrollment context');
  }
};

const asBytes = (value: string): Uint8Array =>
  new TextEncoder().encode(value);

const asBuffer = (value: Uint8Array): ArrayBuffer => {
  const copy = new Uint8Array(value.length);
  copy.set(value);
  return copy.buffer;
};

const encodeJson = (value: unknown, limit: number): string => {
  const encoded = JSON.stringify(value);
  if (encoded === undefined || new TextEncoder().encode(encoded).length > limit)
    throw new Error('Enrollment payload exceeds protocol limit');
  return encoded;
};

const isP256PublicJwk = (value: unknown): value is JsonWebKey => {
  if (!vaultProtocolUtils.isRecord(value)) return false;
  const record = value;
  return (
    record.kty === 'EC' &&
    record.crv === 'P-256' &&
    typeof record.x === 'string' &&
    typeof record.y === 'string' &&
    !('d' in record)
  );
};

const importPublicKey = (jwk: JsonWebKey): Promise<CryptoKey> =>
  crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  );

const deriveTransferKey = async (
  privateKey: CryptoKey,
  publicKey: CryptoKey,
  requestId: string,
  context: EnrollmentContext,
): Promise<CryptoKey> => {
  const shared = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'ECDH', public: publicKey },
      privateKey,
      256,
    ),
  );
  try {
    const material = await crypto.subtle.importKey(
      'raw',
      asBuffer(shared),
      'HKDF',
      false,
      ['deriveKey'],
    );
    return await crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: asBuffer(asBytes(requestId)),
        info: asBuffer(
          asBytes(
            vaultProtocolUtils.canonicalize({ domain: DOMAIN, ...context }),
          ),
        ),
      },
      material,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
  } finally {
    shared.fill(0);
  }
};

const responseHeader = (
  response: Omit<TrustedDeviceResponse, 'ciphertext' | 'signature'>,
): Record<string, unknown> => ({
  domain: DOMAIN,
  formatVersion: response.formatVersion,
  kind: response.kind,
  requestId: response.requestId,
  accountId: response.accountId,
  workspaceId: response.workspaceId,
  vaultId: response.vaultId,
  keyId: response.keyId,
  oldDeviceId: response.oldDeviceId,
  newDeviceId: response.newDeviceId,
  oldEphemeralPublicKey: response.oldEphemeralPublicKey,
  signingPublicKey: response.signingPublicKey,
  nonce: response.nonce,
});

const signaturePayload = (
  response: Omit<TrustedDeviceResponse, 'signature'>,
): Uint8Array =>
  asBytes(
    vaultProtocolUtils.canonicalize({
      ...responseHeader(response),
      ciphertext: response.ciphertext,
    }),
  );

const parseRequest = (value: unknown): TrustedDeviceRequest => {
  if (
    !vaultProtocolUtils.isRecord(value) ||
    !vaultProtocolUtils.hasOnlyKeys(value, [
      'accountId',
      'formatVersion',
      'keyId',
      'kind',
      'newDeviceId',
      'newEphemeralPublicKey',
      'oldDeviceId',
      'requestId',
      'vaultId',
      'workspaceId',
    ]) ||
    value.formatVersion !== FORMAT_VERSION ||
    value.kind !== KIND ||
    !isBoundId(value.accountId) ||
    !isBoundId(value.workspaceId) ||
    !isBoundId(value.vaultId) ||
    !isBoundId(value.keyId) ||
    !isBoundId(value.oldDeviceId) ||
    !isBoundId(value.newDeviceId) ||
    !isBoundId(value.requestId) ||
    !isP256PublicJwk(value.newEphemeralPublicKey)
  )
    throw new Error('Invalid trusted-device request');
  return {
    accountId: value.accountId,
    workspaceId: value.workspaceId,
    vaultId: value.vaultId,
    keyId: value.keyId,
    oldDeviceId: value.oldDeviceId,
    newDeviceId: value.newDeviceId,
    formatVersion: FORMAT_VERSION,
    kind: KIND,
    requestId: value.requestId,
    newEphemeralPublicKey: value.newEphemeralPublicKey,
  };
};

const parseResponse = (value: unknown): TrustedDeviceResponse => {
  if (
    !vaultProtocolUtils.isRecord(value) ||
    !vaultProtocolUtils.hasOnlyKeys(value, [
      'accountId',
      'ciphertext',
      'formatVersion',
      'keyId',
      'kind',
      'newDeviceId',
      'nonce',
      'oldDeviceId',
      'oldEphemeralPublicKey',
      'requestId',
      'signature',
      'signingPublicKey',
      'vaultId',
      'workspaceId',
    ]) ||
    value.formatVersion !== FORMAT_VERSION ||
    value.kind !== KIND ||
    !isBoundId(value.accountId) ||
    !isBoundId(value.workspaceId) ||
    !isBoundId(value.vaultId) ||
    !isBoundId(value.keyId) ||
    !isBoundId(value.oldDeviceId) ||
    !isBoundId(value.newDeviceId) ||
    !isBoundId(value.requestId) ||
    !isP256PublicJwk(value.oldEphemeralPublicKey) ||
    !isP256PublicJwk(value.signingPublicKey) ||
    typeof value.nonce !== 'string' ||
    typeof value.ciphertext !== 'string' ||
    typeof value.signature !== 'string' ||
    value.nonce.length > 64 ||
    value.ciphertext.length > Math.ceil((MAX_RESPONSE_BYTES * 4) / 3) ||
    value.signature.length > 512
  )
    throw new Error('Invalid trusted-device response');
  const nonce = vaultProtocolUtils.fromBase64(value.nonce);
  if (nonce.length !== vaultProtocolConstants.nonceLength)
    throw new Error('Invalid trusted-device response');
  return {
    accountId: value.accountId,
    workspaceId: value.workspaceId,
    vaultId: value.vaultId,
    keyId: value.keyId,
    oldDeviceId: value.oldDeviceId,
    newDeviceId: value.newDeviceId,
    formatVersion: FORMAT_VERSION,
    kind: KIND,
    requestId: value.requestId,
    oldEphemeralPublicKey: value.oldEphemeralPublicKey,
    signingPublicKey: value.signingPublicKey,
    nonce: value.nonce,
    ciphertext: value.ciphertext,
    signature: value.signature,
  };
};

const createRequest = async (
  context: EnrollmentContext,
): Promise<RequestResult> => {
  assertContext(context);
  const keyPair = (await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveBits'],
  ));
  const request: TrustedDeviceRequest = {
    ...context,
    formatVersion: FORMAT_VERSION,
    kind: KIND,
    requestId: vaultProtocolUtils.toBase64(crypto.getRandomValues(new Uint8Array(32))),
    newEphemeralPublicKey: await crypto.subtle.exportKey('jwk', keyPair.publicKey),
  };
  encodeJson(request, MAX_REQUEST_BYTES);
  return { request, privateKey: keyPair.privateKey };
};

const createResponse = async (
  requestValue: unknown,
  vmk: Uint8Array,
  signingKeyPair: CryptoKeyPair,
  signingPublicKey: JsonWebKey,
): Promise<TrustedDeviceResponse> => {
  const request = parseRequest(requestValue);
  if (vmk.length !== vaultProtocolConstants.vmkLength)
    throw new Error('VMK must contain 32 bytes');
  if (!isP256PublicJwk(signingPublicKey))
    throw new Error('Invalid device signing key');
  const newPublicKey = await importPublicKey(request.newEphemeralPublicKey);
  const oldKeyPair = (await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveBits'],
  ));
  const oldPublicKey = await crypto.subtle.exportKey('jwk', oldKeyPair.publicKey);
  const context: EnrollmentContext = {
    accountId: request.accountId,
    workspaceId: request.workspaceId,
    vaultId: request.vaultId,
    keyId: request.keyId,
    oldDeviceId: request.oldDeviceId,
    newDeviceId: request.newDeviceId,
  };
  const nonce = crypto.getRandomValues(new Uint8Array(vaultProtocolConstants.nonceLength));
  const responseWithoutSignature = {
    ...context,
    formatVersion: FORMAT_VERSION,
    kind: KIND,
    requestId: request.requestId,
    oldEphemeralPublicKey: oldPublicKey,
    signingPublicKey,
    nonce: vaultProtocolUtils.toBase64(nonce),
    ciphertext: '',
  };
  const key = await deriveTransferKey(
    oldKeyPair.privateKey,
    newPublicKey,
    request.requestId,
    context,
  );
  const ciphertext = vaultProtocolUtils.toBase64(
    new Uint8Array(
      await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: asBuffer(nonce),
          additionalData: asBuffer(asBytes(vaultProtocolUtils.canonicalize(responseHeader(responseWithoutSignature)))),
        },
        key,
        asBuffer(vmk),
      ),
    ),
  );
  const unsigned = { ...responseWithoutSignature, ciphertext };
  const signature = vaultProtocolUtils.toBase64(
    new Uint8Array(
      await crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        signingKeyPair.privateKey,
        asBuffer(signaturePayload(unsigned)),
      ),
    ),
  );
  const response = { ...unsigned, signature };
  encodeJson(response, MAX_RESPONSE_BYTES);
  return response;
};

const decryptResponse = async (
  responseValue: unknown,
  request: TrustedDeviceRequest,
  privateKey: CryptoKey,
  expectedSigningPublicKey: JsonWebKey,
): Promise<Uint8Array> => {
  const response = parseResponse(responseValue);
  const context: EnrollmentContext = {
    accountId: request.accountId,
    workspaceId: request.workspaceId,
    vaultId: request.vaultId,
    keyId: request.keyId,
    oldDeviceId: request.oldDeviceId,
    newDeviceId: request.newDeviceId,
  };
  if (
    response.requestId !== request.requestId ||
    response.accountId !== context.accountId ||
    response.workspaceId !== context.workspaceId ||
    response.vaultId !== context.vaultId ||
    response.keyId !== context.keyId ||
    response.oldDeviceId !== context.oldDeviceId ||
    response.newDeviceId !== context.newDeviceId ||
    vaultProtocolUtils.canonicalize(response.signingPublicKey) !==
      vaultProtocolUtils.canonicalize(expectedSigningPublicKey)
  )
    throw new Error('Trusted-device response context mismatch');
  const signer = await crypto.subtle.importKey(
    'jwk',
    expectedSigningPublicKey,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify'],
  );
  const { signature: _signature, ...unsignedResponse } = response;
  const valid = await crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    signer,
    asBuffer(vaultProtocolUtils.fromBase64(response.signature)),
    asBuffer(signaturePayload(unsignedResponse)),
  );
  if (!valid) throw new Error('Trusted-device response signature failed');
  const oldPublicKey = await importPublicKey(response.oldEphemeralPublicKey);
  const key = await deriveTransferKey(
    privateKey,
    oldPublicKey,
    request.requestId,
    context,
  );
  const vmk = new Uint8Array(
    await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: asBuffer(vaultProtocolUtils.fromBase64(response.nonce)),
        additionalData: asBuffer(
          asBytes(
            vaultProtocolUtils.canonicalize(
              responseHeader(unsignedResponse),
            ),
          ),
        ),
      },
      key,
      asBuffer(vaultProtocolUtils.fromBase64(response.ciphertext)),
    ),
  );
  if (vmk.length !== vaultProtocolConstants.vmkLength) {
    vmk.fill(0);
    throw new Error('Invalid transferred VMK');
  }
  return vmk;
};

export const trustedDeviceEnrollment = Object.freeze({
  createRequest,
  createResponse,
  decryptResponse,
  parseRequest,
  parseResponse,
  isP256PublicJwk,
});

export type {
  EnrollmentContext,
  RequestResult,
  TrustedDeviceRequest,
  TrustedDeviceResponse,
};
