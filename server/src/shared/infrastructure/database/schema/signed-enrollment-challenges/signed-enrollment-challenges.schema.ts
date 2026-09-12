import {
  pgTable,
  uuid,
  text,
  timestamp,
  check,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from '@shared/infrastructure/database/schema/users.schema';
import { workspaces } from '@shared/infrastructure/database/schema/workspaces.schema';

export const signedEnrollmentChallenges = pgTable(
  'signed_enrollment_challenges',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    vaultId: uuid('vault_id').notNull(),
    deviceId: varchar('device_id', { length: 128 }).notNull(),
    challenge: varchar('challenge', { length: 43 }).notNull().unique(),
    intent: text('intent').notNull(),
    encryptedShare: text('encrypted_share').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  },
  (table) => [
    check(
      'signed_enrollment_challenge_format',
      sql`${table.challenge} ~ '^[A-Za-z0-9_-]{43}$'`,
    ),
    check(
      'signed_enrollment_ttl',
      sql`${table.expiresAt} = ${table.createdAt} + interval '60 seconds'`,
    ),
    check(
      'signed_enrollment_lifecycle',
      sql`(${table.consumedAt} is null and ${table.confirmedAt} is null) or (${table.consumedAt} >= ${table.createdAt} and ${table.consumedAt} < ${table.expiresAt} and (${table.confirmedAt} is null or (${table.confirmedAt} >= ${table.consumedAt} and ${table.confirmedAt} < ${table.expiresAt})))`,
    ),
  ],
);
