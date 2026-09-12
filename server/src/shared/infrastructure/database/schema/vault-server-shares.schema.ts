import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { vaultDevices } from './vault-devices.schema';

export const vaultServerShares = pgTable('vault_server_shares', {
  id: uuid('id').primaryKey(),
  deviceId: uuid('device_id')
    .notNull()
    .unique()
    .references(() => vaultDevices.id, { onDelete: 'cascade' }),
  ciphertext: text('ciphertext').notNull(),
  nonce: text('nonce').notNull(),
  authTag: text('auth_tag').notNull(),
  infrastructureKeyVersion: integer('infrastructure_key_version').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});
