import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.schema';

export const vaults = pgTable('vaults', {
  id: uuid('id').primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .unique()
    .references(() => workspaces.id),
  encryptedBlob: text('encrypted_blob').notNull(),
  contentHash: varchar('content_hash', { length: 64 }).notNull(),
  byteSize: integer('byte_size').notNull(),
  revision: integer('revision').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});
