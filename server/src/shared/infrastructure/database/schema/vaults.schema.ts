import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.schema';

export const vaults = pgTable('vaults', {
  id: uuid('id').primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .unique()
    .references(() => workspaces.id),
  encryptedBlob: text('encrypted_blob').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});
