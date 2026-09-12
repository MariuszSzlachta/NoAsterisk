import { decryptRecord } from '#shared/adapters/persistence/crypto';
import type { BudgetDatabase } from '#shared/adapters/persistence/dexie';
import { LEGACY_MIGRATION_MESSAGES } from '#shared/adapters/persistence/migrations/legacy-migration-messages';
import type { EncryptedLegacySource } from '#shared/adapters/persistence/migrations/legacy-types';

export const verifyLegacySources = async (
  database: BudgetDatabase,
  encryptedSources: ReadonlyArray<EncryptedLegacySource>,
  key: CryptoKey,
): Promise<void> => {
  await Promise.all(
    encryptedSources.map(async ({ source, envelopes }) => {
      const stored = await database.records
        .where('collection')
        .equals(source.collection)
        .toArray();
      if (stored.length !== envelopes.length) {
        throw new Error(LEGACY_MIGRATION_MESSAGES.verificationFailed);
      }
      await Promise.all(
        stored.map((envelope) =>
          decryptRecord(envelope, source.collection, key, source.validator),
        ),
      );
    }),
  );
};
