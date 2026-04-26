// Types
import type { McpServer } from '@atlas/shared';

export type McpServerFormState = {
  name: string;
  command: string;
  argsStr: string;
  envStr: string;
  enabled: boolean;
};

export const emptyMcpServerForm = (): McpServerFormState => ({
  name: '',
  command: '',
  argsStr: '',
  envStr: '',
  enabled: true,
});

/** Serializes a stored args JSON array into a comma-separated display string. */
export function argsToDisplay(args: string | null): string {
  if (!args?.trim()) return '';
  try {
    const parsed = JSON.parse(args) as unknown;
    if (Array.isArray(parsed)) return parsed.map(String).join(', ');
    return '';
  } catch {
    return '';
  }
}

/** Serializes a stored env JSON object into KEY=value lines. */
export function envToDisplay(env: string | null): string {
  if (!env?.trim()) return '';
  try {
    const parsed = JSON.parse(env) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.entries(parsed as Record<string, string>)
        .map(([k, v]) => `${k}=${String(v)}`)
        .join('\n');
    }
    return '';
  } catch {
    return '';
  }
}

export function displayArgsToJson(argsStr: string): string {
  return JSON.stringify(
    argsStr
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean),
  );
}

export function displayEnvToJson(envStr: string): string {
  const obj: Record<string, string> = {};
  for (const line of envStr.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    obj[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return JSON.stringify(obj);
}

export function serverToForm(server: McpServer): McpServerFormState {
  return {
    name: server.name,
    command: server.command,
    argsStr: argsToDisplay(server.args),
    envStr: envToDisplay(server.env),
    enabled: server.enabled,
  };
}
