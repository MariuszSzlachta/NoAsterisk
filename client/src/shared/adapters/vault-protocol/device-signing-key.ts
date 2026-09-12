const generate = async (): Promise<CryptoKeyPair> => {
  const generated = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify'],
  );
  const privateJwk = await crypto.subtle.exportKey('jwk', generated.privateKey);
  const publicJwk = await crypto.subtle.exportKey('jwk', generated.publicKey);
  return {
    privateKey: await crypto.subtle.importKey(
      'jwk',
      privateJwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign'],
    ),
    publicKey: await crypto.subtle.importKey(
      'jwk',
      publicJwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['verify'],
    ),
  };
};

const exportPublicJwk = (key: CryptoKey): Promise<JsonWebKey> =>
  crypto.subtle.exportKey('jwk', key);

const isP256PublicJwk = (value: unknown): value is JsonWebKey => {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return false;
  const record = Object.fromEntries(Object.entries(value));
  return (
    record.kty === 'EC' &&
    record.crv === 'P-256' &&
    typeof record.x === 'string' &&
    typeof record.y === 'string' &&
    !('d' in record)
  );
};

const importPublicJwk = async (value: unknown): Promise<CryptoKey> => {
  if (!isP256PublicJwk(value)) throw new Error('Invalid device signing key');
  return crypto.subtle.importKey(
    'jwk',
    value,
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['verify'],
  );
};

export const deviceSigningKey = Object.freeze({
  generate,
  exportPublicJwk,
  importPublicJwk,
});
