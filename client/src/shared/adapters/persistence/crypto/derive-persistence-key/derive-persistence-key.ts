import {
  AES_GCM_ALGORITHM,
  AES_KEY_LENGTH,
  PBKDF2_ALGORITHM,
  PBKDF2_ITERATIONS,
  SHA_256_ALGORITHM,
} from '#shared/adapters/persistence/crypto/constants';

/** Derives the non-extractable AES-GCM vault key used for local encrypted records. */
export const derivePersistenceKey = async (
  passphrase: string,
  salt: ArrayBuffer,
): Promise<CryptoKey> => {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    PBKDF2_ALGORITHM,
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: PBKDF2_ALGORITHM,
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: SHA_256_ALGORITHM,
    },
    keyMaterial,
    { name: AES_GCM_ALGORITHM, length: AES_KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  );
};
