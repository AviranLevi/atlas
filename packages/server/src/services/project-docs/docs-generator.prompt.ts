export const MERMAID_SYSTEM_PROMPT =
  'You are a technical documentation expert. Generate concise, accurate Mermaid diagrams from code. ' +
  'Return ONLY a single markdown heading followed by a SINGLE ```mermaid code fence containing the complete diagram. ' +
  'Never split the diagram across multiple code fences. Never add prose, explanations, or extra code blocks.';

export const API_TABLE_SYSTEM_PROMPT =
  'You are a technical documentation expert. Generate concise, accurate API documentation from code. ' +
  'Return ONLY structured markdown with grouped tables. No Mermaid, no diagrams, no prose outside headings and tables.';

export function buildApiTablePrompt(promptIntro: string, content: string): string {
  return [
    promptIntro,
    'Format the output as grouped markdown tables:',
    '',
    '## Resource Name',
    '',
    '| Method | Path | Description |',
    '|--------|------|-------------|',
    '| GET | `/users` | List all users |',
    '',
    'Rules:',
    '- Group endpoints by resource/domain (Users, Auth, Products, etc.)',
    '- Every endpoint gets a one-line description inferred from the code',
    '- Use exact paths with params as `:paramName`',
    '- Method must be uppercase (GET, POST, PUT, PATCH, DELETE)',
    '- If an OpenAPI spec is provided, include response codes in the description',
    '',
    content,
  ].join('\n');
}

export function buildDbSchemaPrompt(content: string): string {
  return [
    'Given these database schema definitions, generate a Mermaid ER diagram showing all tables and their columns.',
    'Use `erDiagram` format. Strict rules:',
    '- Output ONE complete `erDiagram` block — never split into multiple blocks',
    '- Each attribute line must be exactly: `type attributeName` with NO quoted strings after it',
    '- Use camelCase for attribute names — no underscores',
    '- Omit all relationship lines — show tables and columns only',
    '- Do NOT use comments, quoted descriptions, or any text after the attribute name',
    '',
    content,
  ].join('\n');
}

export function buildArchitecturePrompt(contextParts: string[]): string {
  return [
    'Given this project context, generate a Mermaid diagram showing the high-level system architecture — services, data stores, and key interactions.',
    'Use `graph TD` format. Strict rules for valid Mermaid graph syntax:',
    '- Node IDs must be single words with NO spaces (use camelCase or underscores: `nextApi`, `postgres_db`)',
    '- Node labels go in brackets: `nextApi["Next.js API"]`',
    '- Edges use `-->` with optional quoted labels: `nextApi -->|"reads"| postgresDb`',
    '- NEVER use `=`, spaces in node IDs, or bare text outside node/edge definitions',
    '- Output ONE complete `graph TD` block only',
    '',
    contextParts.join('\n\n'),
  ].join('\n');
}
