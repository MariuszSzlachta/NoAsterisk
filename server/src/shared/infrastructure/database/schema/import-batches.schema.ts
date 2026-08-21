import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.schema';

export const importBatches = pgTable(
  'import_batches',
  {
    id: uuid('id').primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    batchHash: varchar('batch_hash', { length: 128 }).notNull(),
    sourceFilename: varchar('source_filename', { length: 255 }),
    totalRows: integer('total_rows').notNull(),
    savedRows: integer('saved_rows').notNull(),
    status: varchar('status', { length: 30 }).notNull(),
    importedAt: timestamp('imported_at', { withTimezone: true }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [index('idx_import_batches_workspace').on(table.workspaceId)],
);
