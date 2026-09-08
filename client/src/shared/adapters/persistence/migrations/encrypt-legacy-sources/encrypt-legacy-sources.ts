import { encryptRecord } from '#shared/adapters/persistence/crypto';
import { getLegacyRecordId } from '#shared/adapters/persistence/migrations/get-legacy-record-id';
import type { EncryptedLegacySource, ValidatedLegacySource } from '#shared/adapters/persistence/migrations/legacy-types';

export const encryptLegacySources = async (
  sources: ReadonlyArray<ValidatedLegacySource>,
  key: CryptoKey,
): Promise<ReadonlyArray<EncryptedLegacySource>> =>
  Promise.all(
    sources.map(async ({ source, records }) => ({
      source,
      envelopes: await Promise.all(
        records.map((record) => encryptRecord(source.collection, getLegacyRecordId(record), record, key)),
      ),
    })),
  );
