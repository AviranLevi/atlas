import type { ThinkingStep } from './chat-page.types';

/**
 * Split CLI-streamed content (which may embed "▸ tool hint" lines) into
 * structured steps and the actual response text.
 */
export function parseAgentContent(content: string): { steps: ThinkingStep[]; response: string } {
  const lines = content.split('\n');
  const steps: ThinkingStep[] = [];
  const responseLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('▸ ')) {
      const rest = line.slice(2).trim();
      const firstSpace = rest.indexOf(' ');
      const toolName = firstSpace > -1 ? rest.slice(0, firstSpace) : rest;
      const hint = firstSpace > -1 ? rest.slice(firstSpace + 1).trim() : '';
      steps.push({ id: String(steps.length), toolName, hint });
    } else {
      responseLines.push(line);
    }
  }

  return { steps, response: responseLines.join('\n').trim() };
}
