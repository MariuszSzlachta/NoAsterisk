export {
  AES_KEY_LENGTH,
  AAD_PREFIX,
  CRYPTO_VERSION,
  IV_LENGTH,
  PBKDF2_ITERATIONS,
  SALT_LENGTH,
  SENTINEL_COLLECTION,
  SENTINEL_ID,
  SENTINEL_VALUE,
} from '#shared/adapters/persistence/crypto/constants';
export {
  createPersistenceCryptoError,
  createPersistenceLockedError,
} from '#shared/adapters/persistence/crypto/errors';
export { derivePersistenceKey } from '#shared/adapters/persistence/crypto/derive-persistence-key';
export { composeRecordAad } from '#shared/adapters/persistence/crypto/compose-record-aad';
export { createSentinel } from '#shared/adapters/persistence/crypto/create-sentinel';
export { decryptBytes } from '#shared/adapters/persistence/crypto/decrypt-bytes';
export { decryptRecord } from '#shared/adapters/persistence/crypto/decrypt-record';
export { encryptBytes } from '#shared/adapters/persistence/crypto/encrypt-bytes';
export { encryptRecord } from '#shared/adapters/persistence/crypto/encrypt-record';
export { isEncryptedRecordEnvelope } from '#shared/adapters/persistence/crypto/is-encrypted-record-envelope';
export { verifySentinel } from '#shared/adapters/persistence/crypto/verify-sentinel';
