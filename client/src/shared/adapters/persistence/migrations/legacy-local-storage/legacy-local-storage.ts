import type { BudgetDatabase } from '#shared/adapters/persistence/dexie';
import type { DatabaseMetadataRecord } from '#shared/adapters/persistence/ports';
import { encryptLegacySources } from '#shared/adapters/persistence/migrations/encrypt-legacy-sources';
import { LEGACY_MIGRATION_MESSAGES } from '#shared/adapters/persistence/migrations/legacy-migration-messages';
import { LEGACY_SOURCES } from '#shared/adapters/persistence/migrations/legacy-sources';
import type { LegacyMigrationResult, ValidatedLegacySource } from '#shared/adapters/persistence/migrations/legacy-types';
import { readLegacySource } from '#shared/adapters/persistence/migrations/read-legacy-source';
import { verifyLegacySources } from '#shared/adapters/persistence/migrations/verify-legacy-sources';

export const migrateLegacyLocalStorage = async (
  database: BudgetDatabase,
  key: CryptoKey,
  metadata: DatabaseMetadataRecord,
): Promise<LegacyMigrationResult> => {
  if (metadata.legacyMigration === 'complete') {
    return { status: 'skipped' };
  }

  const results = LEGACY_SOURCES.map(readLegacySource);
  if (results.some((result) => result === 'invalid')) {
    return { status: 'invalid', warning: LEGACY_MIGRATION_MESSAGES.invalidData };
  }

  const validated = results.filter(
    (result): result is ValidatedLegacySource =>
      result !== 'absent' && result !== 'invalid',
  );
  if (validated.length === 0) {
    await database.metadata.put({ ...metadata, legacyMigration: 'complete', updatedAt: Date.now() });
    return { status: 'complete' };
  }

  const encryptedSources = await encryptLegacySources(validated, key);
  await database.transaction('rw', database.records, async () => {
    await encryptedSources.reduce(
      async (previous, { source, envelopes }) => {
        await previous;
        await database.records.where('collection').equals(source.collection).delete();
        await database.records.bulkPut(envelopes);
      },
      Promise.resolve(),
    );
  });

  await verifyLegacySources(database, encryptedSources, key);
  validated.forEach(({ source }) => localStorage.removeItem(source.key));
  await database.metadata.put({ ...metadata, legacyMigration: 'complete', updatedAt: Date.now() });
  return { status: 'complete' };
};
