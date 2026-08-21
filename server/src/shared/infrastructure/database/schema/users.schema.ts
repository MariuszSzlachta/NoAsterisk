import { pgTable, uuid, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.schema';

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  displayName: varchar('display_name', { length: 50 }),
  preferences: jsonb('preferences').notNull().default('{}'),
});
