import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const permissions = pgTable(
  'permissions',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    resourceType: varchar('resource_type', { length: 20 }).notNull(),
    resourceId: uuid('resource_id').notNull(),
    actions: jsonb('actions').notNull().default('[]'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => [index('idx_permissions_user').on(table.userId)],
);
