export const decryptBytes = async (
  key: CryptoKey,
  ciphertext: ArrayBuffer,
  iv: ArrayBuffer,
  additionalData?: ArrayBuffer,
): Promise<ArrayBuffer> =>
  crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
      ...(additionalData ? { additionalData } : {}),
    },
    key,
    ciphertext,
  );
