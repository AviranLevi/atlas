export const MAX_TOTAL_BYTES = 80 * 1024;
export const MAX_SPEC_BYTES = 50 * 1024;

export const SKIP_DIRS = new Set([
  'node_modules', 'dist', '__pycache__', '.git', '.next', 'build', 'coverage',
]);

export const ROUTE_PATTERNS = [/\.route\.ts$/, /\.routes\.ts$/, /routes\.\w+$/, /\.controller\.ts$/];

export const SCHEMA_FILE_PATTERNS = [
  /\.schema\.ts$/,
  /\.entity\.ts$/,
  /\.model\.ts$/,
  /schema\.prisma$/,
  /migrations\/.*\.sql$/,
  /models\.py$/,
];
export const SCHEMA_FOLDER_PATTERN = /\/(schemas|models|entities)\//;

export const OPENAPI_SPEC_NAMES = [
  'openapi.json', 'openapi.yaml', 'openapi.yml',
  'swagger.json', 'swagger.yaml', 'swagger.yml',
  'swagger-spec.json',
];
export const OPENAPI_SPEC_DIRS = ['', 'docs', 'swagger', 'api-docs', 'openapi'];
