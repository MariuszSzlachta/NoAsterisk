import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { vaults } from './vaults.schema';
import { vaultDevices } from './vault-devices.schema';

export const vaultSyncSnapshots = pgTable('vault_sync_snapshots', {
  id: uuid('id').primaryKey(),
  vaultId: uuid('vault_id')
    .notNull()
    .references(() => vaults.id, { onDelete: 'cascade' }),
  deviceId: uuid('device_id')
    .notNull()
    .references(() => vaultDevices.id, { onDelete: 'cascade' }),
  keyId: varchar('key_id', { length: 128 }).notNull(),
  revision: integer('revision').notNull(),
  envelopeHash: varchar('envelope_hash', { length: 128 }).notNull(),
  previousEnvelopeHash: varchar('previous_envelope_hash', {
    length: 128,
  }).notNull(),
  header: text('header').notNull(),
  ciphertext: text('ciphertext').notNull(),
  signature: text('signature').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});
