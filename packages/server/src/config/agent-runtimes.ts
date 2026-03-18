export interface AgentRuntimeConfig {
  id: string;
  name: string;
  command: string;
  args: string[];
  promptDelivery: 'flag' | 'positional' | 'stdin';
  promptFlag?: string;
  mcpConfigSupported: boolean;
}

export const AGENT_RUNTIMES: AgentRuntimeConfig[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    command: 'claude',
    args: ['--print'],
    promptDelivery: 'positional',
    mcpConfigSupported: true,
  },
  {
    id: 'aider',
    name: 'Aider',
    command: 'aider',
    args: ['--yes-always', '--no-git'],
    promptDelivery: 'flag',
    promptFlag: '--message',
    mcpConfigSupported: false,
  },
  {
    id: 'codex',
    name: 'OpenAI Codex',
    command: 'codex',
    args: ['--quiet'],
    promptDelivery: 'positional',
    mcpConfigSupported: false,
  },
];

export function getRuntimeById(id: string): AgentRuntimeConfig | undefined {
  return AGENT_RUNTIMES.find((r) => r.id === id);
}

export function listRuntimes(): AgentRuntimeConfig[] {
  return AGENT_RUNTIMES;
}
