export const encryptBytes = async (
  key: CryptoKey,
  plaintext: Uint8Array,
  iv: Uint8Array,
  additionalData?: Uint8Array,
): Promise<ArrayBuffer> =>
  crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv.slice().buffer,
      ...(additionalData ? { additionalData: additionalData.slice().buffer } : {}),
    },
    key,
    plaintext.slice().buffer,
  );
