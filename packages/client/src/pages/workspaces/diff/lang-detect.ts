const EXT_TO_LANG: Record<string, string> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'jsx',
  mjs: 'javascript',
  cjs: 'javascript',
  mts: 'typescript',
  cts: 'typescript',
  py: 'python',
  rs: 'rust',
  go: 'go',
  rb: 'ruby',
  java: 'java',
  kt: 'kotlin',
  swift: 'swift',
  cs: 'csharp',
  cpp: 'cpp',
  c: 'c',
  h: 'c',
  hpp: 'cpp',
  css: 'css',
  scss: 'scss',
  less: 'less',
  html: 'html',
  htm: 'html',
  vue: 'html',
  svelte: 'html',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  md: 'markdown',
  mdx: 'markdown',
  sql: 'sql',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  xml: 'xml',
  svg: 'xml',
  graphql: 'graphql',
  gql: 'graphql',
  lua: 'lua',
  dart: 'dart',
  php: 'php',
  ini: 'ini',
  env: 'bash',
};

const FILENAME_TO_LANG: Record<string, string> = {
  Dockerfile: 'docker',
  Makefile: 'makefile',
  Gemfile: 'ruby',
  Rakefile: 'ruby',
  Vagrantfile: 'ruby',
};

/** Detects the Prism language identifier from a filename. Returns undefined for unknown types. */
export function detectLanguage(filename: string): string | undefined {
  const basename = filename.split('/').pop() ?? filename;

  if (FILENAME_TO_LANG[basename]) return FILENAME_TO_LANG[basename];

  const ext = basename.includes('.') ? basename.split('.').pop()?.toLowerCase() : undefined;
  if (!ext) return undefined;

  return EXT_TO_LANG[ext];
}
