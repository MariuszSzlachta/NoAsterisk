import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { vaultDevices } from './vault-devices.schema';
import { vaultKeysets } from './vault-keysets.schema';

export const vaultDeviceEnvelopes = pgTable(
  'vault_device_envelopes',
  {
    id: uuid('id').primaryKey(),
    deviceId: uuid('device_id')
      .notNull()
      .references(() => vaultDevices.id, { onDelete: 'cascade' }),
    keysetId: uuid('keyset_id')
      .notNull()
      .references(() => vaultKeysets.id, { onDelete: 'cascade' }),
    purpose: varchar('purpose', { length: 32 }).notNull(),
    envelope: text('envelope').notNull(),
    protocolVersion: varchar('protocol_version', { length: 32 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex('vault_device_envelopes_device_purpose_unique').on(
      table.deviceId,
      table.purpose,
    ),
  ],
);
