// Types
import type { DiffFile } from '../services/worktree/worktree.types.js';

export type SecretFinding = {
  filename: string;
  line: number;
  pattern: string;
};

export type SecretScanResult = {
  hasSecrets: boolean;
  findings: SecretFinding[];
};

const SECRET_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'Private Key', regex: /-----BEGIN\s+(?:RSA|EC|DSA|OPENSSH|PGP)?\s*PRIVATE\s+KEY-----/ },
  { name: 'Generic API Key', regex: /(?:api[_-]?key|apikey)\s*[:=]\s*['"]?[A-Za-z0-9_-]{20,}['"]?/i },
  { name: 'Generic Secret', regex: /(?:secret|password|passwd|token)\s*[:=]\s*['"]?[A-Za-z0-9_-]{8,}['"]?/i },
  { name: 'GitHub Token', regex: /gh[pousr]_[A-Za-z0-9_]{36,}/ },
];

/** Files that are themselves secret-bearing by convention. */
const SENSITIVE_FILENAMES = new Set(['.env', '.env.local', '.env.production', '.env.staging']);

/**
 * Scans diff patches for common secret patterns.
 *
 * Best-effort heuristic — false positives are expected and the user can
 * override via the `skipSecretsScan` flag. Only added lines (starting
 * with `+`, excluding `+++` headers) are scanned.
 */
export function scanForSecrets(files: DiffFile[]): SecretScanResult {
  const findings: SecretFinding[] = [];

  for (const file of files) {
    // Flag entire .env files by convention
    const basename = file.filename.split('/').pop() ?? '';
    if (SENSITIVE_FILENAMES.has(basename)) {
      findings.push({ filename: file.filename, line: 0, pattern: 'Sensitive file' });
      continue;
    }

    if (!file.patch) continue;

    const lines = file.patch.split('\n');
    let lineNumber = 0;

    for (const line of lines) {
      // Only scan added lines (lines starting with +, excluding +++ header)
      if (!line.startsWith('+') || line.startsWith('+++')) continue;
      lineNumber++;
      const content = line.slice(1); // Remove the leading +

      for (const { name, regex } of SECRET_PATTERNS) {
        if (regex.test(content)) {
          findings.push({ filename: file.filename, line: lineNumber, pattern: name });
          break; // One finding per line is enough
        }
      }
    }
  }

  return { hasSecrets: findings.length > 0, findings };
}
