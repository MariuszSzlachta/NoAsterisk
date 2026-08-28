import { KEY_LENGTH } from '#features/user-settings/model/encrypt-vault/constants/key-length';
import { PBKDF2_ITERATIONS } from '#features/user-settings/model/encrypt-vault/constants/pbkdf2-iterations';

export const deriveKey = async (
  password: string,
  salt: Uint8Array,
  usage: 'encrypt' | 'decrypt',
): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    [usage],
  );
};
