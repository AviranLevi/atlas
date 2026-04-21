export const WORKSPACES_DIR = '.agent-workspaces';

// Used exclusively by JS minimatch (with { dot: true }) — NOT as git pathspecs.
// Git negative pathspecs with ** prefix silently fail to match top-level dirs.
// Each directory pattern needs both forms: **/dir (matches the dir itself) and
// **/dir/** (matches contents). Filename patterns (**/foo.yaml) work as-is.
export const DIFF_EXCLUDE_PATTERNS = [
  '**/node_modules',
  '**/node_modules/**',
  '**/pnpm-lock.yaml',
  '**/package-lock.json',
  '**/yarn.lock',
  '**/bun.lockb',
  '**/.pnpm-store',
  '**/.pnpm-store/**',
  '**/dist',
  '**/dist/**',
  '**/.next',
  '**/.next/**',
  '**/.nuxt',
  '**/.nuxt/**',
  '**/.turbo',
  '**/.turbo/**',
];

export const DIFF_MAX_BUFFER = 50 * 1024 * 1024;

export const PER_FILE_LINE_CAP = 20_000;
