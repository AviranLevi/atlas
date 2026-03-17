import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { uuidDefault, timestampDefault } from '../helpers/index.js';

export const skills = sqliteTable('skills', {
  id: text('id')
    .primaryKey()
    .$defaultFn(uuidDefault),
  name: text('name').notNull(),
  type: text('type'),
  steps: text('steps'),
  inputFormat: text('input_format'),
  outputFormat: text('output_format'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(timestampDefault),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(timestampDefault),
});
