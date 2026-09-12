import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { vaultDevices } from './vault-devices.schema';
import { vaults } from './vaults.schema';

export const vaultRotations = pgTable(
  'vault_rotations',
  {
    id: uuid('id').primaryKey(),
    vaultId: uuid('vault_id')
      .notNull()
      .references(() => vaults.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    deviceId: uuid('device_id')
      .notNull()
      .references(() => vaultDevices.id, { onDelete: 'cascade' }),
    idempotencyKey: varchar('idempotency_key', { length: 128 }).notNull(),
    currentKeyId: varchar('current_key_id', { length: 128 }).notNull(),
    nextKeyId: varchar('next_key_id', { length: 128 }).notNull(),
    envelopePurpose: varchar('envelope_purpose', { length: 32 }).notNull(),
    envelope: text('envelope').notNull(),
    protocolVersion: varchar('protocol_version', { length: 32 }).notNull(),
    cryptoSuite: varchar('crypto_suite', { length: 128 }).notNull(),
    revokedDeviceCount: integer('revoked_device_count').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    unique('vault_rotations_vault_id_idempotency_key_unique').on(
      table.vaultId,
      table.idempotencyKey,
    ),
  ],
);
