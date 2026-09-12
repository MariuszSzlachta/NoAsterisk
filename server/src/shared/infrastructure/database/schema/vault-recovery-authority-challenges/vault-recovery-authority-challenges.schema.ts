import { sql } from 'drizzle-orm';
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from '@shared/infrastructure/database/schema/users.schema';
import { vaults } from '@shared/infrastructure/database/schema/vaults.schema';
import { workspaces } from '@shared/infrastructure/database/schema/workspaces.schema';

export const vaultRecoveryAuthorityChallenges = pgTable(
  'vault_recovery_authority_challenges',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    vaultId: uuid('vault_id')
      .notNull()
      .references(() => vaults.id, { onDelete: 'cascade' }),
    keyId: varchar('key_id', { length: 128 }).notNull(),
    deviceId: varchar('device_id', { length: 128 }).notNull(),
    challenge: varchar('challenge', { length: 43 }).notNull().unique(),
    signingPublicKey: text('signing_public_key').notNull(),
    recoveryPublicKey: varchar('recovery_public_key', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
  },
  (table) => [
    index('vault_recovery_authority_challenges_expiry_idx').on(table.expiresAt),
    check(
      'vault_recovery_authority_challenges_challenge_check',
      sql`${table.challenge} ~ '^[A-Za-z0-9_-]{43}$'`,
    ),
    check(
      'vault_recovery_authority_challenges_recovery_public_key_check',
      sql`${table.recoveryPublicKey} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      'vault_recovery_authority_challenges_ttl',
      sql`${table.expiresAt} = ${table.createdAt} + interval '60 seconds'`,
    ),
    check(
      'vault_recovery_authority_challenges_consumed_at',
      sql`${table.consumedAt} IS NULL OR (${table.consumedAt} >= ${table.createdAt} AND ${table.consumedAt} < ${table.expiresAt})`,
    ),
  ],
);
