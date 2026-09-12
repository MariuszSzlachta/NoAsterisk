import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const webauthnCredentials = pgTable('webauthn_credentials', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  credentialId: varchar('credential_id', { length: 1024 }).notNull().unique(),
  publicKey: text('public_key').notNull(),
  counter: varchar('counter', { length: 32 }).notNull(),
  transports: varchar('transports', { length: 256 }),
  supportsPrf: integer('supports_prf').notNull().default(0),
  credentialDeviceType: varchar('credential_device_type', { length: 32 }),
  credentialBackedUp: integer('credential_backed_up').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
});
