import { IV_LENGTH } from '#features/user-settings/model/encrypt-vault/constants/iv-length';
import { SALT_LENGTH } from '#features/user-settings/model/encrypt-vault/constants/salt-length';
import { deriveKey } from '#features/user-settings/model/encrypt-vault/derive-key';
import { uint8ToBase64 } from '#features/user-settings/model/encrypt-vault/uint8-to-base64';

/** Encrypts plaintext for vault storage. PBKDF2 → AES-GCM-256. Output: base64(salt[16] || iv[12] || ciphertext). Fresh salt+IV per call. */
export const encryptVault = async (plaintext: string, password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt, 'encrypt');

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext),
  );

  const combined = new Uint8Array(SALT_LENGTH + IV_LENGTH + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, SALT_LENGTH);
  combined.set(new Uint8Array(ciphertext), SALT_LENGTH + IV_LENGTH);

  return uint8ToBase64(combined);
};
