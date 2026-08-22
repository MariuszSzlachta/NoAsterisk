import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const inviteCodes = pgTable('invite_codes', {
  id: uuid('id').primaryKey(),
  code: varchar('code', { length: 8 }).notNull().unique(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  status: varchar('status', { length: 20 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  usedBy: uuid('used_by').references(() => users.id),
  usedAt: timestamp('used_at', { withTimezone: true }),
});
