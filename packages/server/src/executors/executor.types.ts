export type PromptDelivery = 'flag' | 'positional' | 'stdin';

export type McpConfigFormat = 'claude' | 'cursor' | 'generic-json' | 'none';

export type ProviderField = 'apiKey' | 'baseUrl';

export interface ModelPreset {
  value: string;
  label: string;
  /** Which ProviderType this model requires (e.g. 'anthropic', 'openai', 'ollama'). */
  provider?: string;
}

export interface ProviderMapping {
  providerType: string;
  /** Maps environment variable names to AgentProvider fields. */
  envVars: Record<string, ProviderField>;
}

export interface ExecutorConfig {
  id: string;
  name: string;
  command: string;
  args: string[];
  promptDelivery: PromptDelivery;
  promptFlag?: string;
  mcpConfigFormat: McpConfigFormat;
  /** Flag to get version output (e.g. "--version", "-v") */
  versionFlag: string;
  /** Command + args to verify the CLI is authenticated/usable. Exit 0 = ready. */
  authCheck?: { args: string[]; stdin?: string; timeoutMs?: number };
  /** Hint shown when auth check fails (e.g. "Run `claude /login`") */
  authHint?: string;
  /** Setup steps: install command, auth command */
  setup?: { install: string; auth?: string };
  /** Environment variables to set when spawning */
  env?: Record<string, string>;
  /** Whether this executor should operate in the project root rather than worktree */
  usesProjectRoot?: boolean;
  /** Description shown in the UI */
  description: string;
  /** URL to the agent's docs/homepage */
  docsUrl?: string;
  /** CLI flag for model selection (e.g. '--model'). Omit if CLI doesn't support it. */
  modelFlag?: string;
  /** Default model used when none is specified. */
  defaultModel?: string;
  /** Well-known models for quick selection in the UI. */
  modelPresets?: ModelPreset[];
  /** How to inject AgentProvider credentials as environment variables per provider type. */
  providerMapping?: ProviderMapping[];
  /** Whether the UI should allow free-text model input. Defaults to true. */
  supportsCustomModel?: boolean;
}

export interface ExecutorStatus {
  id: string;
  name: string;
  description: string;
  docsUrl?: string;
  installed: boolean;
  authenticated: boolean;
  mcpConfigFormat: McpConfigFormat;
  version?: string;
  binaryPath?: string;
  authHint?: string;
  setup?: { install: string; auth?: string };
  modelFlag?: string;
  defaultModel?: string;
  modelPresets?: ModelPreset[];
  providerMapping?: ProviderMapping[];
  supportsCustomModel?: boolean;
}
