// External
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// DB
import { timestampDefault, uuidDefault } from '../helpers/index.js';

export const integrations = sqliteTable(
  'integrations',
  {
    id: text('id').primaryKey().$defaultFn(uuidDefault),
    name: text('name').notNull(),
    apiKey: text('api_key'),
    baseUrl: text('base_url'),
    enabled: integer('enabled', { mode: 'boolean' }).notNull().default(false),
    config: text('config'),
    createdAt: text('created_at').notNull().$defaultFn(timestampDefault),
    updatedAt: text('updated_at').notNull().$defaultFn(timestampDefault),
  },
  (table) => [uniqueIndex('integrations_name_unique').on(table.name)],
);
