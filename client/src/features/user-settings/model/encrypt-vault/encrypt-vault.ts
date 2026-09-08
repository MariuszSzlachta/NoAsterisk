import { IV_LENGTH } from '#features/user-settings/model/encrypt-vault/constants/iv-length';
import { SALT_LENGTH } from '#features/user-settings/model/encrypt-vault/constants/salt-length';
import { deriveKey } from '#features/user-settings/model/encrypt-vault/derive-key';
import { uint8ToBase64 } from '#features/user-settings/model/encrypt-vault/uint8-to-base64';
import { MAX_ENCRYPTED_VAULT_LENGTH } from '#features/user-settings/model/vault-limits';
import { VaultSizeError } from '#features/user-settings/model/vault-size-error';
import { encryptBytes } from '#shared/adapters/persistence/crypto';

export const encryptVault = async (
  plaintext: string,
  password: string,
): Promise<string> => {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt, 'encrypt');

  const ciphertext = await encryptBytes(key, encoder.encode(plaintext), iv);

  const combined = Uint8Array.from([
    ...salt,
    ...iv,
    ...new Uint8Array(ciphertext),
  ]);

  const encrypted = uint8ToBase64(combined);
  if (encrypted.length > MAX_ENCRYPTED_VAULT_LENGTH) {
    throw new VaultSizeError();
  }
  return encrypted;
};
