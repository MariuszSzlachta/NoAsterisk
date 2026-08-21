import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.schema';

export const importProfiles = pgTable(
  'import_profiles',
  {
    id: uuid('id').primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    name: varchar('name', { length: 100 }).notNull(),
    bankName: varchar('bank_name', { length: 100 }),
    columnMapping: jsonb('column_mapping').notNull(),
    parserConfig: jsonb('parser_config').notNull(),
    anonymizationConfig: jsonb('anonymization_config').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => [index('idx_import_profiles_workspace').on(table.workspaceId)],
);
