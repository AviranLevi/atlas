// Shared
import type { ChatMessage } from '@atlas/shared';

// Services
import { projectsService } from '../index.js';

// Lib
import type { InternalMessage, ToolContext } from '../../lib/chat/index.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'services/chat/chat-context.ts';

/** Adapts persisted ChatMessage rows to the model-facing InternalMessage shape. */
export function toInternalMessages(messages: ChatMessage[]): InternalMessage[] {
  return messages.map((m) => {
    if (m.role === 'user') {
      return {
        role: 'user' as const,
        content: m.content,
        attachments: m.attachments ?? undefined,
      };
    }
    if (m.role === 'tool') {
      const toolCallId = m.toolResults?.[0]?.toolCallId ?? 'unknown';
      return { role: 'tool' as const, toolCallId, content: m.content };
    }
    return {
      role: 'assistant' as const,
      content: m.content,
      toolCalls: m.toolCalls ?? undefined,
    };
  });
}

/** Builds the ToolContext that chat tools see when executing inside a conversation. */
export async function getProjectContext(
  projectId: string | null,
  mentionedAgentId?: string | null,
): Promise<ToolContext> {
  if (!projectId) return { mentionedAgentId };
  try {
    const { project } = await projectsService.getContext(projectId);
    return { projectId, projectLocalPath: project.localPath ?? null, mentionedAgentId };
  } catch (error: unknown) {
    logger.warn(`${FILE_PATH} :: getProjectContext failed`, error);
    return { projectId, mentionedAgentId };
  }
}
