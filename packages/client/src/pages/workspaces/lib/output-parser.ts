// Shared
import { stripCliPromptEchoStreaming } from '@atlas/shared';

export type NarrativeBlock = {
  type: 'narrative';
  content: string;
};

export type ToolCallBlock = {
  type: 'tool_call';
  tool: string;
  args: string;
  index: number;
};

export type OutputBlock = NarrativeBlock | ToolCallBlock;

const TOOL_CALL_WITH_ARGS = /^▸\s+(\S+)\s{2,}(.*)$/;
const TOOL_CALL_BARE = /^▸\s+(\S+)\s*$/;
// eslint-disable-next-line no-control-regex
const ANSI_REGEX = /\x1b\[[0-9;]*m/g;

/** Strips ANSI escape sequences (color codes) from text. */
export function stripAnsi(text: string): string {
  return text.replace(ANSI_REGEX, '');
}

/**
 * Parses raw agent output text into typed blocks.
 * Strips echoed prompt blocks first, then splits on `▸ tool_name  args` lines.
 * Consecutive non-tool lines merge into a single NarrativeBlock.
 */
export function parseAgentOutput(text: string): OutputBlock[] {
  const cleaned = stripCliPromptEchoStreaming(text);
  if (!cleaned) return [];

  const lines = cleaned.split('\n');
  const blocks: OutputBlock[] = [];
  let narrativeLines: string[] = [];
  let toolIndex = 0;

  const flushNarrative = (): void => {
    const content = narrativeLines.join('\n').trim();
    if (content) {
      blocks.push({ type: 'narrative', content });
    }
    narrativeLines = [];
  };

  for (const line of lines) {
    const matchArgs = TOOL_CALL_WITH_ARGS.exec(line);
    if (matchArgs) {
      flushNarrative();
      blocks.push({ type: 'tool_call', tool: matchArgs[1], args: matchArgs[2], index: toolIndex++ });
      continue;
    }

    const matchBare = TOOL_CALL_BARE.exec(line);
    if (matchBare) {
      flushNarrative();
      blocks.push({ type: 'tool_call', tool: matchBare[1], args: '', index: toolIndex++ });
      continue;
    }

    narrativeLines.push(line);
  }

  flushNarrative();
  return blocks;
}
