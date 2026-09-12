import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { vaultKeysets } from './vault-keysets.schema';

export const vaultDevices = pgTable(
  'vault_devices',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    keysetId: uuid('keyset_id')
      .notNull()
      .references(() => vaultKeysets.id, { onDelete: 'cascade' }),
    deviceId: varchar('device_id', { length: 128 }).notNull(),
    signingPublicKey: text('signing_public_key'),
    status: varchar('status', { length: 32 }).notNull(),
    revoked: boolean('revoked').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('vault_devices_user_device_unique').on(
      table.userId,
      table.deviceId,
    ),
  ],
);
