#!/usr/bin/env node
/**
 * Validates Drizzle migration files.
 *
 * Drizzle requires `--> statement-breakpoint` between every SQL statement
 * in a migration file. If a file contains multiple statements (i.e. more
 * than one semicolon) without this marker, the migration runner will fail
 * at startup with a cryptic error.
 *
 * Run via: pnpm db:validate
 * Also runs automatically as a pre-commit hook on any staged migration files.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, '../packages/server/src/db/migrations');

// Allow targeting specific files via CLI args (used by the pre-commit hook)
const targetFiles = process.argv.slice(2);

function getMigrationFiles() {
  if (targetFiles.length > 0) {
    return targetFiles.filter((f) => f.endsWith('.sql') && !f.includes('/meta/'));
  }
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .map((f) => path.join(MIGRATIONS_DIR, f));
}

function validate(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Strip comment lines to avoid counting semicolons in comments
  const withoutComments = content
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n');

  // Count statement-ending semicolons
  const statementCount = (withoutComments.match(/;\s*$/gm) ?? []).length;

  if (statementCount <= 1) return null; // Single statement — no breakpoint needed

  // Multiple statements: every boundary between them needs a breakpoint.
  // The breakpoint must appear between consecutive statements.
  const breakpointCount = (content.match(/--> statement-breakpoint/g) ?? []).length;
  const expectedBreakpoints = statementCount - 1;

  if (breakpointCount < expectedBreakpoints) {
    return (
      `  ${path.basename(filePath)}: ${statementCount} statements but only ${breakpointCount}/${expectedBreakpoints} ` +
      `"--> statement-breakpoint" markers.\n` +
      `  Add "--> statement-breakpoint" on its own line between every pair of SQL statements.`
    );
  }

  return null;
}

const files = getMigrationFiles();
const errors = [];

for (const file of files) {
  const error = validate(file);
  if (error) errors.push(error);
}

if (errors.length > 0) {
  console.error('\n❌ Migration validation failed:\n');
  for (const e of errors) {
    console.error(`${e}\n`);
  }
  console.error(
    'Drizzle requires "--> statement-breakpoint" between every SQL statement in a migration file.\n' +
      'Use "pnpm db:generate" to auto-generate migrations instead of writing them by hand.\n',
  );
  process.exit(1);
}

console.log(`✓ All ${files.length} migration file(s) valid.`);
