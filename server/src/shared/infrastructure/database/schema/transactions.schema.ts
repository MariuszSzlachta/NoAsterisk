import {
  pgTable,
  uuid,
  varchar,
  numeric,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.schema';

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    accountId: uuid('account_id').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    type: varchar('type', { length: 20 }).notNull(),
    date: timestamp('date', { withTimezone: true }).notNull(),
    categoryIds: jsonb('category_ids').notNull().default([]),
    contentHash: varchar('content_hash', { length: 128 }),
    budgetId: uuid('budget_id'),
    balance: numeric('balance', { precision: 14, scale: 2 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('idx_transactions_workspace').on(table.workspaceId),
    index('idx_transactions_content_hash').on(
      table.workspaceId,
      table.contentHash,
    ),
  ],
);
