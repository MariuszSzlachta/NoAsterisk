import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { vaults } from './vaults.schema';

export const webauthnChallenges = pgTable('webauthn_challenges', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  vaultId: uuid('vault_id').references(() => vaults.id, {
    onDelete: 'cascade',
  }),
  deviceId: varchar('device_id', { length: 128 }).notNull(),
  challenge: varchar('challenge', { length: 128 }).notNull().unique(),
  type: varchar('type', { length: 32 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});
