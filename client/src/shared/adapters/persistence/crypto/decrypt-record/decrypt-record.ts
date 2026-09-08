import { createPersistenceCryptoError } from '#shared/adapters/persistence/crypto/errors';
import { composeRecordAad } from '#shared/adapters/persistence/crypto/compose-record-aad';
import { decryptBytes } from '#shared/adapters/persistence/crypto/decrypt-bytes';
import { isEncryptedRecordEnvelope } from '#shared/adapters/persistence/crypto/is-encrypted-record-envelope';
import type { PersistenceCollection } from '#shared/adapters/persistence/ports';

const decoder = new TextDecoder();

export const decryptRecord = async <TRecord extends object>(
  envelope: unknown,
  expectedCollection: PersistenceCollection,
  key: CryptoKey,
  validator: (value: unknown) => value is TRecord,
): Promise<TRecord> => {
  if (!isEncryptedRecordEnvelope(envelope, expectedCollection)) {
    throw createPersistenceCryptoError('Invalid encrypted record envelope');
  }

  let plaintext: ArrayBuffer;
  try {
    plaintext = await decryptBytes(
      key,
      envelope.ciphertext,
      envelope.iv,
      composeRecordAad(envelope.collection, envelope.id, envelope.cryptoVersion),
    );
  } catch {
    throw createPersistenceCryptoError('Encrypted record authentication failed');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(decoder.decode(plaintext));
  } catch {
    throw createPersistenceCryptoError('Encrypted record is not valid JSON');
  }

  if (!validator(parsed)) {
    throw createPersistenceCryptoError('Encrypted record failed validation');
  }
  return parsed;
};
