import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { uuidDefault, timestampDefault } from '../helpers/index.js';

export const mcpServers = sqliteTable('mcp_servers', {
  id: text('id')
    .primaryKey()
    .$defaultFn(uuidDefault),
  name: text('name').notNull().unique(),
  command: text('command').notNull(),
  args: text('args'),
  env: text('env'),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(timestampDefault),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(timestampDefault),
});
