import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  integer,
} from 'drizzle-orm/pg-core';
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
  tokenVersion: integer('token_version').notNull().default(0),
  privacyPolicyVersion: varchar('privacy_policy_version', { length: 64 }),
  termsVersion: varchar('terms_version', { length: 64 }),
  consentAt: timestamp('consent_at', { withTimezone: true }),
});
