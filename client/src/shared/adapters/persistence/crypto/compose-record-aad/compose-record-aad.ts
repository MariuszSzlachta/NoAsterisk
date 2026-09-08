import { AAD_PREFIX, CRYPTO_VERSION } from '#shared/adapters/persistence/crypto/constants';
import type { PersistenceCollection } from '#shared/adapters/persistence/ports';

const encoder = new TextEncoder();

export const composeRecordAad = (
  collection: PersistenceCollection,
  id: string,
  cryptoVersion: number = CRYPTO_VERSION,
): ArrayBuffer => encoder.encode(`${AAD_PREFIX}|${cryptoVersion}|${collection}|${id}`).buffer;
