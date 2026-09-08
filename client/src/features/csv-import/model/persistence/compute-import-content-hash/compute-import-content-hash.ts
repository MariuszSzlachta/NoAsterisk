import { HASH_SEPARATOR } from '#features/csv-import/model/persistence/compute-import-content-hash/constants/hash-separator';
import { SHA_256_ALGORITHM } from '#shared/adapters/persistence/crypto/constants';
import { bytesToHex } from '#shared/lib/bytes-to-hex';

/**
 * Builds the deduplication key from exactly the fields that are persisted.
 * The description is normalized before hashing so equivalent reviewed values
 * produce the same key without retaining the original title or other CSV PII.
 */
export const computeImportContentHash = async (
  date: string,
  amount: number,
  description: string,
): Promise<string> => {
  const input = [date, amount, description.toLowerCase().trim()].join(HASH_SEPARATOR);
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest(SHA_256_ALGORITHM, encoded);
  return bytesToHex(new Uint8Array(hashBuffer));
};
