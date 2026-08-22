import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
  unique,
} from 'drizzle-orm/pg-core';

export const dictionaries = pgTable(
  'dictionaries',
  {
    id: uuid('id').primaryKey(),
    type: varchar('type', { length: 30 }).notNull(),
    value: varchar('value', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('idx_dictionaries_type').on(table.type),
    unique('uq_dictionaries_type_value').on(table.type, table.value),
  ],
);
