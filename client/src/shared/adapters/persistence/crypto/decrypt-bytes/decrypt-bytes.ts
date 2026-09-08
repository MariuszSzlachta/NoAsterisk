import { AES_GCM_ALGORITHM } from '#shared/adapters/persistence/crypto/constants';

/** Decrypts authenticated AES-GCM bytes and rejects tampered ciphertext or AAD. */
export const decryptBytes = async (
  key: CryptoKey,
  ciphertext: ArrayBuffer,
  iv: ArrayBuffer,
  additionalData?: ArrayBuffer,
): Promise<ArrayBuffer> =>
  crypto.subtle.decrypt(
    {
      name: AES_GCM_ALGORITHM,
      iv,
      ...(additionalData ? { additionalData } : {}),
    },
    key,
    ciphertext,
  );
