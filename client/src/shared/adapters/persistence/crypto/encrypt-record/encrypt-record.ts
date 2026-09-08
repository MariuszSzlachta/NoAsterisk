import { CRYPTO_VERSION, IV_LENGTH } from '#shared/adapters/persistence/crypto/constants';
import { composeRecordAad } from '#shared/adapters/persistence/crypto/compose-record-aad';
import { encryptBytes } from '#shared/adapters/persistence/crypto/encrypt-bytes';
import type { EncryptedRecordEnvelope, PersistenceCollection } from '#shared/adapters/persistence/ports';

const encoder = new TextEncoder();

export const encryptRecord = async (
  collection: PersistenceCollection,
  id: string,
  record: object,
  key: CryptoKey,
  updatedAt: number = Date.now(),
): Promise<EncryptedRecordEnvelope> => {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertext = await encryptBytes(
    key,
    encoder.encode(JSON.stringify(record)),
    iv,
    new Uint8Array(composeRecordAad(collection, id)),
  );

  return {
    id,
    collection,
    ciphertext,
    iv: iv.slice().buffer,
    cryptoVersion: CRYPTO_VERSION,
    updatedAt,
  };
};
