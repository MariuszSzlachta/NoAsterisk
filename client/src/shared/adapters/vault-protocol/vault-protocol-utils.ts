import { vaultProtocolConstants } from '#shared/adapters/vault-protocol/vault-protocol-constants';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const encode = (value: string): Uint8Array => new TextEncoder().encode(value);
const asBuffer = (value: Uint8Array): ArrayBuffer => {
  const copy = new Uint8Array(value.length);
  copy.set(value);
  return copy.buffer;
};
const decode = (value: Uint8Array): string => new TextDecoder().decode(value);
const toBase64 = (value: Uint8Array): string =>
  btoa(
    Array.from({ length: Math.ceil(value.length / 0x8000) }, (_, index) =>
      String.fromCharCode(...value.slice(index * 0x8000, (index + 1) * 0x8000)),
    ).join(''),
  );
const fromBase64 = (value: unknown): Uint8Array<ArrayBuffer> => {
  if (
    typeof value !== 'string' ||
    value.length >
      Math.ceil((vaultProtocolConstants.maxCiphertextBytes * 4) / 3) + 4 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      value,
    )
  )
    throw new Error('Invalid base64 encoding');
  const decoded = atob(value);
  const output = new Uint8Array(new ArrayBuffer(decoded.length));
  decoded.split('').forEach((character, index) => {
    output[index] = character.charCodeAt(0);
  });
  return output;
};
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
const hasOnlyKeys = (
  value: Record<string, unknown>,
  keys: ReadonlyArray<string>,
): boolean =>
  Object.keys(value).every((key) => keys.includes(key)) &&
  keys.every((key) => key in value);
const getString = (value: unknown, key: string): string => {
  if (!isRecord(value) || typeof value[key] !== 'string')
    throw new Error(`Invalid ${key}`);
  return value[key];
};
const composeAad = (context: object): Uint8Array => {
  const value = Object.fromEntries(Object.entries(context));
  const keys =
    'collection' in value
      ? vaultProtocolConstants.envelopeHeaderKeys
      : 'purpose' in value
        ? vaultProtocolConstants.wrapHeaderKeys
        : vaultProtocolConstants.snapshotHeaderKeys;
  return encode(
    canonicalize(
      Object.fromEntries(
        keys.filter((key) => key in value).map((key) => [key, value[key]]),
      ),
    ),
  );
};
const derivePurposeKey = async (
  vmk: Uint8Array,
  salt: string,
  label: string,
): Promise<CryptoKey> => {
  const material = await crypto.subtle.importKey(
    'raw',
    asBuffer(vmk),
    vaultProtocolConstants.hkdfAlgorithm,
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: vaultProtocolConstants.hkdfAlgorithm,
      salt: asBuffer(encode(salt)),
      info: asBuffer(encode(label)),
      hash: vaultProtocolConstants.sha256Algorithm,
    },
    material,
    {
      name: vaultProtocolConstants.aesAlgorithm,
      length: vaultProtocolConstants.aesKeyLength,
    },
    false,
    ['encrypt', 'decrypt'],
  );
};
const importHkdfKey = async (material: Uint8Array): Promise<CryptoKey> =>
  crypto.subtle.importKey(
    'raw',
    asBuffer(material),
    vaultProtocolConstants.hkdfAlgorithm,
    false,
    ['deriveKey'],
  );
const deriveHkdfAesKey = async (
  material: CryptoKey,
  salt: Uint8Array,
  info: Uint8Array,
): Promise<CryptoKey> =>
  crypto.subtle.deriveKey(
    {
      name: vaultProtocolConstants.hkdfAlgorithm,
      salt: asBuffer(salt),
      info: asBuffer(info),
      hash: vaultProtocolConstants.sha256Algorithm,
    },
    material,
    {
      name: vaultProtocolConstants.aesAlgorithm,
      length: vaultProtocolConstants.aesKeyLength,
    },
    false,
    ['encrypt', 'decrypt'],
  );
const assertShare = (share: Uint8Array, name: string): void => {
  if (share.length !== vaultProtocolConstants.maxShareLength)
    throw new Error(`${name} must contain 32 bytes`);
};
const encrypt = async (
  plaintext: string,
  aad: Uint8Array,
  key: CryptoKey,
  nonce = crypto.getRandomValues(
    new Uint8Array(vaultProtocolConstants.nonceLength),
  ),
) => {
  const bytes = encode(plaintext);
  if (bytes.length > vaultProtocolConstants.maxPlaintextBytes)
    throw new Error('Plaintext exceeds protocol limit');
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: vaultProtocolConstants.aesAlgorithm,
      iv: asBuffer(nonce),
      additionalData: asBuffer(aad),
    },
    key,
    asBuffer(bytes),
  );
  return {
    header: {
      formatVersion: vaultProtocolConstants.protocolVersion,
      cryptoSuite: vaultProtocolConstants.cryptoSuite,
      nonce: toBase64(nonce),
    },
    ciphertext: toBase64(new Uint8Array(ciphertext)),
  };
};
const decrypt = async (
  ciphertext: string,
  nonceValue: string,
  aad: Uint8Array,
  key: CryptoKey,
): Promise<string> => {
  const plaintext = await crypto.subtle.decrypt(
    {
      name: vaultProtocolConstants.aesAlgorithm,
      iv: asBuffer(fromBase64(nonceValue)),
      additionalData: asBuffer(aad),
    },
    key,
    asBuffer(fromBase64(ciphertext)),
  );
  if (plaintext.byteLength > vaultProtocolConstants.maxPlaintextBytes)
    throw new Error('Plaintext exceeds protocol limit');
  return decode(new Uint8Array(plaintext));
};
const validateEnvelope = (
  value: unknown,
): value is {
  readonly header: Record<string, unknown>;
  readonly ciphertext: string;
} => {
  if (
    !isRecord(value) ||
    !isRecord(value.header) ||
    !hasOnlyKeys(value, ['header', 'ciphertext']) ||
    typeof value.ciphertext !== 'string'
  )
    return false;
  const header = value.header;
  try {
    return (
      header.formatVersion === vaultProtocolConstants.protocolVersion &&
      header.cryptoSuite === vaultProtocolConstants.cryptoSuite &&
      (hasOnlyKeys(header, vaultProtocolConstants.envelopeHeaderKeys) ||
        hasOnlyKeys(header, vaultProtocolConstants.snapshotHeaderKeys)) &&
      value.ciphertext.length <=
        Math.ceil((vaultProtocolConstants.maxCiphertextBytes * 4) / 3) &&
      fromBase64(value.ciphertext).length <=
        vaultProtocolConstants.maxCiphertextBytes
    );
  } catch {
    return false;
  }
};
const validateWrapEnvelope = (
  value: unknown,
): value is {
  readonly header: Record<string, unknown>;
  readonly ciphertext: string;
} => {
  if (
    !isRecord(value) ||
    !isRecord(value.header) ||
    !hasOnlyKeys(value, ['header', 'ciphertext']) ||
    typeof value.ciphertext !== 'string' ||
    value.ciphertext.length >
      Math.ceil((vaultProtocolConstants.maxCiphertextBytes * 4) / 3)
  )
    return false;
  let ciphertextLength = 0;
  try {
    ciphertextLength = fromBase64(value.ciphertext).length;
  } catch {
    return false;
  }
  if (ciphertextLength > vaultProtocolConstants.maxCiphertextBytes)
    return false;
  if (!hasOnlyKeys(value.header, vaultProtocolConstants.wrapHeaderKeys))
    return false;
  return (
    value.header.formatVersion === vaultProtocolConstants.vmkEnvelopeVersion &&
    value.header.cryptoSuite === vaultProtocolConstants.cryptoSuite &&
    typeof value.header.purpose === 'string' &&
    typeof value.header.accountId === 'string' &&
    typeof value.header.workspaceId === 'string' &&
    typeof value.header.vaultId === 'string' &&
    typeof value.header.keyId === 'string' &&
    typeof value.header.deviceId === 'string' &&
    typeof value.header.credentialId === 'string' &&
    fromBase64(getString(value.header, 'nonce')).length ===
      vaultProtocolConstants.nonceLength
  );
};
const validateSnapshot = (
  value: unknown,
): value is {
  readonly header: Record<string, unknown>;
  readonly ciphertext: string;
  readonly signature: string;
} => {
  if (
    !isRecord(value) ||
    !isRecord(value.header) ||
    typeof value.ciphertext !== 'string' ||
    value.header.formatVersion !== vaultProtocolConstants.protocolVersion ||
    value.header.cryptoSuite !== vaultProtocolConstants.cryptoSuite ||
    typeof value.signature !== 'string' ||
    !hasOnlyKeys(value.header, vaultProtocolConstants.snapshotHeaderKeys) ||
    value.ciphertext.length >
      Math.ceil((vaultProtocolConstants.maxCiphertextBytes * 4) / 3)
  )
    return false;
  const header = value.header;
  try {
    return (
      typeof header.accountId === 'string' &&
      typeof header.workspaceId === 'string' &&
      typeof header.vaultId === 'string' &&
      typeof header.keyId === 'string' &&
      typeof header.revision === 'number' &&
      Number.isSafeInteger(header.revision) &&
      header.revision > 0 &&
      typeof header.previousEnvelopeHash === 'string' &&
      header.previousEnvelopeHash.length <= 256 &&
      typeof header.createdByDeviceId === 'string' &&
      typeof header.createdAt === 'string' &&
      typeof header.nonce === 'string' &&
      fromBase64(header.nonce).length === vaultProtocolConstants.nonceLength &&
      fromBase64(value.signature).length > 0 &&
      fromBase64(value.signature).length <= 512 &&
      hasOnlyKeys(value, ['header', 'ciphertext', 'signature'])
    );
  } catch {
    return false;
  }
};
const assertContext = (header: object, context: object): void => {
  const headerValue = Object.entries(header);
  const contextValue = Object.entries(context);
  const matches = ['accountId', 'workspaceId', 'vaultId', 'keyId'].every(
    (key) =>
      headerValue.find(([name]) => name === key)?.[1] ===
      contextValue.find(([name]) => name === key)?.[1],
  );
  if (!matches) throw new Error('Vault context mismatch');
};
const createSignaturePayload = (
  header: object,
  ciphertext: string,
): Uint8Array =>
  encode(
    `${vaultProtocolConstants.domainSeparator}|${canonicalize(header)}|${ciphertext}`,
  );

export const vaultProtocolUtils = {
  asBuffer,
  assertContext,
  canonicalize,
  composeAad,
  createSignaturePayload,
  decrypt,
  derivePurposeKey,
  deriveHkdfAesKey,
  encrypt,
  fromBase64,
  getString,
  hasOnlyKeys,
  isRecord,
  toBase64,
  validateEnvelope,
  validateWrapEnvelope,
  importHkdfKey,
  assertShare,
  validateSnapshot,
};
