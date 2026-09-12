import { AES_GCM_ALGORITHM } from '#shared/adapters/persistence/crypto/constants';

/** Encrypts bytes with authenticated AES-GCM; callers must provide a fresh IV per write. */
export const encryptBytes = async (
  key: CryptoKey,
  plaintext: Uint8Array,
  iv: Uint8Array,
  additionalData?: Uint8Array,
): Promise<ArrayBuffer> =>
  crypto.subtle.encrypt(
    {
      name: AES_GCM_ALGORITHM,
      iv: iv.slice().buffer,
      ...(additionalData
        ? { additionalData: additionalData.slice().buffer }
        : {}),
    },
    key,
    plaintext.slice().buffer,
  );
