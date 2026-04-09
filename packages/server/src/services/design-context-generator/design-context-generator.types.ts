/**
 * Map of relative file path → truncated file contents.
 * Populated from the project `localPath` (first matching CSS + first matching Tailwind config).
 */
export type DesignSourceFileMap = Record<string, string>;
