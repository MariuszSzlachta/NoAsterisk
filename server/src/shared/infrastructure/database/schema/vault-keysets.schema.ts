import { sql } from 'drizzle-orm';
import { check, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { vaults } from '@shared/infrastructure/database/schema/vaults.schema';

export const vaultKeysets = pgTable(
  'vault_keysets',
  {
    id: uuid('id').primaryKey(),
    vaultId: uuid('vault_id')
      .notNull()
      .unique()
      .references(() => vaults.id, { onDelete: 'cascade' }),
    keyId: varchar('key_id', { length: 128 }).notNull(),
    protocolVersion: varchar('protocol_version', { length: 32 }).notNull(),
    cryptoSuite: varchar('crypto_suite', { length: 128 }).notNull(),
    recoveryPublicKey: varchar('recovery_public_key', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    check(
      'vault_keysets_recovery_public_key_format',
      sql`${table.recoveryPublicKey} IS NULL OR ${table.recoveryPublicKey} ~ '^[0-9a-f]{64}$'`,
    ),
  ],
);
