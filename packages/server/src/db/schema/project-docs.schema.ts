// External
import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';

// DB
import { timestampDefault, uuidDefault } from '../helpers/index.js';
import { projects } from './projects.schema.js';

export const projectDocs = sqliteTable(
  'project_docs',
  {
    id: text('id').primaryKey().$defaultFn(uuidDefault),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    /** 'api-diagram' | 'db-schema' | 'architecture' | 'plan' | 'custom' */
    type: text('type').notNull().default('custom'),
    /** Markdown with embedded Mermaid blocks */
    content: text('content').notNull().default(''),
    /** 'user' | 'ai' */
    source: text('source').notNull().default('user'),
    generatedAt: text('generated_at'),
    createdAt: text('created_at').notNull().$defaultFn(timestampDefault),
    updatedAt: text('updated_at').notNull().$defaultFn(timestampDefault),
  },
  (table) => ({
    projectIdIdx: index('project_docs_project_id_idx').on(table.projectId),
    typeIdx: index('project_docs_type_idx').on(table.type),
  }),
);
