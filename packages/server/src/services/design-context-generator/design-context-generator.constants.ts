/** Max lines read per on-disk design file (CSS / Tailwind config) so the prompt stays bounded. */
export const MAX_DESIGN_SOURCE_FILE_LINES = 200;

/** Max tokens for the model response when generating DESIGN.md content. */
export const DESIGN_CONTEXT_MAX_OUTPUT_TOKENS = 4096;

/** Candidate paths (relative to repo root) for the primary global stylesheet. First match wins. */
export const DESIGN_CSS_FILE_CANDIDATES: readonly string[] = [
  'src/index.css',
  'src/app.css',
  'src/globals.css',
  'src/styles/globals.css',
  'src/styles/index.css',
  'app/globals.css',
  'styles/globals.css',
  'index.css',
];

/** Tailwind config filenames; first match wins. */
export const DESIGN_TAILWIND_CONFIG_CANDIDATES: readonly string[] = [
  'tailwind.config.ts',
  'tailwind.config.js',
  'tailwind.config.mjs',
  'tailwind.config.cjs',
];

/**
 * Substrings matched against package names from the project scan (`includes`).
 * Used to list UI-oriented dependencies in the generation prompt.
 */
export const UI_DEPENDENCY_SUBSTRINGS: readonly string[] = [
  'react',
  'vue',
  'svelte',
  'solid-js',
  'angular',
  'next',
  'nuxt',
  'remix',
  'astro',
  'tailwindcss',
  '@tailwindcss/vite',
  '@radix-ui',
  'shadcn',
  '@shadcn/ui',
  'styled-components',
  '@emotion/react',
  '@stitches/react',
  'chakra-ui',
  '@chakra-ui/react',
  'mantine',
  '@mantine/core',
  'antd',
  'ant-design',
  'material-ui',
  '@mui/material',
  'framer-motion',
  'react-spring',
  'lucide-react',
  'react-icons',
  '@heroicons/react',
];

/** Default chat model id per provider `type` when generating design context. */
export const DEFAULT_DESIGN_CONTEXT_MODELS: Record<string, string> = {
  anthropic: 'claude-3-5-haiku-20241022',
  openai: 'gpt-4o-mini',
  'openai-compatible': 'gpt-4o-mini',
  google: 'gemini-1.5-flash',
  ollama: 'llama3.1',
};

export const DEFAULT_DESIGN_CONTEXT_MODEL_FALLBACK = 'gpt-4o-mini';

/**
 * Provider types tried in order when picking which configured API to use.
 * Matches `resolveProvider` behavior: first configured type in this list wins.
 */
export const DESIGN_CONTEXT_PROVIDER_PREFERENCE: readonly string[] = [
  'anthropic',
  'openai',
  'google',
  'openai-compatible',
  'ollama',
];
