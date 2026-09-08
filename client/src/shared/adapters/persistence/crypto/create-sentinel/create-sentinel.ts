import { SENTINEL_COLLECTION, SENTINEL_ID, SENTINEL_VALUE } from '#shared/adapters/persistence/crypto/constants';
import { encryptRecord } from '#shared/adapters/persistence/crypto/encrypt-record';
import type { EncryptedRecordEnvelope } from '#shared/adapters/persistence/ports';

export const createSentinel = async (key: CryptoKey): Promise<EncryptedRecordEnvelope> =>
  encryptRecord(SENTINEL_COLLECTION, SENTINEL_ID, { value: SENTINEL_VALUE }, key);
