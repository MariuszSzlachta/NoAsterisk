import { IV_LENGTH } from '#features/user-settings/model/encrypt-vault/constants/iv-length';
import { SALT_LENGTH } from '#features/user-settings/model/encrypt-vault/constants/salt-length';
import { deriveKey } from '#features/user-settings/model/encrypt-vault/derive-key';
import { VaultDecryptionError } from '#features/user-settings/model/vault-decryption-error';
import { decryptBytes } from '#shared/adapters/persistence/crypto';

import { base64ToUint8 } from '#features/user-settings/model/decrypt-vault/base64-to-uint8';

export const decryptVault = async (encryptedBase64: string, password: string): Promise<string> => {
  const decoder = new TextDecoder();
  const binary = base64ToUint8(encryptedBase64);

  if (binary.length < SALT_LENGTH + IV_LENGTH + 1) {
    throw new VaultDecryptionError('Invalid vault data: too short');
  }

  const salt = binary.slice(0, SALT_LENGTH);
  const iv = binary.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = binary.slice(SALT_LENGTH + IV_LENGTH);

  const key = await deriveKey(password, salt, 'decrypt');

  try {
    const plainBuffer = await decryptBytes(key, ciphertext.slice().buffer, iv.slice().buffer);
    return decoder.decode(plainBuffer);
  } catch {
    throw new VaultDecryptionError('Decryption failed — wrong password or corrupted data');
  }
};
