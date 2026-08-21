import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.schema';

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    name: varchar('name', { length: 100 }).notNull(),
    color: varchar('color', { length: 7 }),
    icon: varchar('icon', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => [index('idx_categories_workspace').on(table.workspaceId)],
);
