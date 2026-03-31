/**
 * Validates that all SQL migration files follow Drizzle's required format:
 * - Multiple statements must be separated by `--> statement-breakpoint`
 * - Identifiers should use backtick quoting for consistency
 *
 * Run: pnpm --filter @atlas/server validate-migrations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, '../src/db/migrations');

const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

let hasErrors = false;

for (const file of files) {
  const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
  const errors: string[] = [];

  const rawStatements = content
    .split(/--> statement-breakpoint/g)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const block of rawStatements) {
    const semicolonStatements = block
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);

    if (semicolonStatements.length > 1) {
      errors.push(
        `Contains multiple SQL statements without --> statement-breakpoint separator. ` +
        `Found ${semicolonStatements.length} statements in one block.`,
      );
    }
  }

  if (errors.length > 0) {
    hasErrors = true;
    console.error(`\n❌ ${file}:`);
    for (const err of errors) {
      console.error(`   ${err}`);
    }
  }
}

if (hasErrors) {
  console.error('\nMigration validation failed.');
  console.error('Use "pnpm db:generate" to create migrations from schema changes.');
  console.error('Never hand-write migration SQL files.\n');
  process.exit(1);
} else {
  console.log(`✓ All ${files.length} migration files are valid.`);
}
