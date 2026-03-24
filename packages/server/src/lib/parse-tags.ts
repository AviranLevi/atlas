/**
 * Safely parse a tags field from the database.
 * Handles JSON arrays, comma-separated strings, and null/empty values.
 */
export function parseTags(raw: string | null | undefined): string[] {
  if (!raw || raw.trim() === '') return [];

  // Try JSON first (for values stored as '["a","b"]')
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Fall through to comma-separated
    }
  }

  // Comma-separated string (e.g. "nestjs,controllers")
  return raw.split(',').map((t) => t.trim()).filter(Boolean);
}
