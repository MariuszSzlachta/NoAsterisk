import { sql } from 'drizzle-orm';
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { vaults } from './vaults.schema';
import { workspaces } from './workspaces.schema';

export const vaultRotationChallenges = pgTable(
  'vault_rotation_challenges',
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
    deviceId: varchar('device_id', { length: 128 }).notNull(),
    currentKeyId: varchar('current_key_id', { length: 128 }).notNull(),
    nextKeyId: varchar('next_key_id', { length: 128 }).notNull(),
    challenge: varchar('challenge', { length: 43 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    currentRecoveryPublicKey: varchar('current_recovery_public_key', {
      length: 64,
    }).notNull(),
    nextRecoveryPublicKey: varchar('next_recovery_public_key', {
      length: 64,
    }).notNull(),
    signingPublicKey: text('signing_public_key').notNull(),
    envelopePurpose: varchar('envelope_purpose', { length: 32 }).notNull(),
    envelope: text('envelope').notNull(),
    passkeyEnvelope: text('passkey_envelope'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('vault_rotation_challenges_challenge_unique').on(
      table.challenge,
    ),
    index('vault_rotation_challenges_scope_idx').on(
      table.userId,
      table.workspaceId,
      table.vaultId,
      table.deviceId,
    ),
    check(
      'vault_rotation_challenges_format',
      sql`${table.challenge} ~ '^[A-Za-z0-9_-]{43}$'`,
    ),
    check(
      'vault_rotation_challenges_ttl',
      sql`${table.expiresAt} = ${table.createdAt} + interval '60 seconds'`,
    ),
    check(
      'vault_rotation_challenges_recovery_keys',
      sql`${table.currentRecoveryPublicKey} ~ '^[0-9a-f]{64}$' AND ${table.nextRecoveryPublicKey} ~ '^[0-9a-f]{64}$' AND ${table.currentRecoveryPublicKey} <> ${table.nextRecoveryPublicKey}`,
    ),
    check(
      'vault_rotation_challenges_lifecycle',
      sql`${table.consumedAt} IS NULL OR (${table.consumedAt} >= ${table.createdAt} AND ${table.consumedAt} < ${table.expiresAt})`,
    ),
  ],
);
