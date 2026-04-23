/**
 * Chat orchestration: persists messages, streams model output through an SSE-style emit callback.
 * API path: provider streaming with multi-round tool execution. CLI path: formatCliPrompt + streamCliChat.
 * Streaming failures use emit('error', …) rather than AppError so the HTTP layer can keep the stream contract.
 */

// Shared
import type { AgentProvider, ChatAttachment, ChatConversation, ChatMessage, CreateConversation } from '@atlas/shared';

// Services
import { agentProvidersService, agentsService, projectsService, usageService } from '../index.js';

// Executors
import { executorRegistry } from '../../executors/index.js';

// Repositories
import { chatRepository } from '../../db/repositories/index.js';

// Lib
import {
  type InternalMessage,
  type ToolContext,
  CHAT_TOOLS,
  executeTool,
  formatCliPrompt,
  streamChat,
  streamCliChat,
} from '../../lib/chat/index.js';
import { logger } from '../../lib/logger.js';

import { buildChatSystemPrompt } from './chat-system-prompt.js';

const FILE_PATH = 'services/chat/chat.service.ts';
const MAX_TOOL_ROUNDS = 10;

type StreamCallback = (event: string, data: unknown) => void | Promise<void>;

type PendingToolCall = { id: string; name: string; args: Record<string, unknown> };

export class ChatService {
  private readonly repo = chatRepository;
  private activeStreams = new Map<string, AbortController>();

  async listConversations(projectId?: string | null): Promise<ChatConversation[]> {
    return this.repo.findAllConversations(projectId);
  }

  async getConversation(id: string): Promise<ChatConversation> {
    return this.repo.findConversationByIdOrThrow(id);
  }

  async createConversation(data: CreateConversation): Promise<ChatConversation> {
    return this.repo.insertConversation(data);
  }

  async deleteConversation(id: string): Promise<void> {
    this.abortStream(id);
    this.repo.removeConversation(id);
  }

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    return this.repo.findMessagesByConversation(conversationId);
  }

  abortStream(conversationId: string): void {
    const controller = this.activeStreams.get(conversationId);
    if (controller) {
      controller.abort();
      this.activeStreams.delete(conversationId);
    }
  }

  async sendMessage(
    conversationId: string,
    content: string,
    emit: StreamCallback,
    attachments?: ChatAttachment[],
    mentionedAgentId?: string | null,
  ): Promise<void> {
    const conversation = this.repo.findConversationByIdOrThrow(conversationId);
    this.repo.insertMessage({
      conversationId,
      role: 'user',
      content,
      attachments: attachments ?? null,
    });

    let mentionedAgent: { id: string; name: string } | null = null;
    if (mentionedAgentId) {
      try {
        const agent = await agentsService.getById(mentionedAgentId);
        mentionedAgent = { id: agent.id, name: agent.name };
      } catch {
        /* agent not found — ignore */
      }
    }

    if (conversation.backendType === 'cli') {
      await this.sendMessageCli(conversation, content, emit, mentionedAgent);
    } else {
      await this.sendMessageApi(conversation, emit, mentionedAgent);
    }
  }

  private beginStreamSession(conversationId: string): AbortController {
    const controller = new AbortController();
    this.activeStreams.set(conversationId, controller);
    return controller;
  }

  private endStreamSession(conversationId: string): void {
    this.activeStreams.delete(conversationId);
  }

  /** Avoids leaving the last message as user-only when the client aborts mid-stream. */
  private insertCancelledAssistantMessage(conversationId: string): void {
    this.repo.insertMessage({ conversationId, role: 'assistant', content: '(response cancelled)' });
  }

  private async sendMessageApi(
    conversation: ChatConversation,
    emit: StreamCallback,
    mentionedAgent: { id: string; name: string } | null,
  ): Promise<void> {
    const FUNCTION_NAME = 'sendMessageApi';
    const conversationId = conversation.id;

    if (!conversation.providerId) {
      await emit('error', { message: 'No provider configured for this conversation' });
      return;
    }

    const provider = await agentProvidersService.getById(conversation.providerId);
    const abortController = this.beginStreamSession(conversationId);

    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    try {
      const startMs = Date.now();
      logger.info(`${FILE_PATH} :: ${FUNCTION_NAME} - start [conv=${conversationId}]`);
      const systemPrompt = await buildChatSystemPrompt(conversation.projectId, mentionedAgent);
      let messages = this.toInternalMessages(this.repo.findMessagesByConversation(conversationId));

      let toolRound = 0;
      let done = false;

      while (!done && toolRound < MAX_TOOL_ROUNDS) {
        if (abortController.signal.aborted) break;

        const { assistantText, pendingToolCalls, roundInputTokens, roundOutputTokens } =
          await this.runSingleModelStream({
            conversation,
            provider,
            systemPrompt,
            messages,
            signal: abortController.signal,
            emit,
          });

        totalInputTokens += roundInputTokens;
        totalOutputTokens += roundOutputTokens;

        if (abortController.signal.aborted) break;

        if (pendingToolCalls.length > 0) {
          messages = await this.persistToolRoundAndExecute(
            conversationId,
            conversation,
            assistantText,
            pendingToolCalls,
            emit,
            mentionedAgent?.id,
          );
          toolRound++;
        } else {
          const savedMsg = this.repo.insertMessage({
            conversationId,
            role: 'assistant',
            content: assistantText,
          });
          await emit('done', { messageId: savedMsg.id });
          done = true;
        }
      }

      if (toolRound >= MAX_TOOL_ROUNDS && !done) {
        const savedMsg = this.repo.insertMessage({
          conversationId,
          role: 'assistant',
          content: '(Reached maximum tool call rounds)',
        });
        await emit('done', { messageId: savedMsg.id });
      }

      if (totalInputTokens > 0 || totalOutputTokens > 0) {
        try {
          usageService.log({
            conversationId,
            projectId: conversation.projectId ?? undefined,
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            model: conversation.model ?? undefined,
            providerType: provider.type,
          });
        } catch (err) {
          logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} usage log failed`, err);
        }
      }

      logger.info(
        `${FILE_PATH} :: ${FUNCTION_NAME} - done in ${Date.now() - startMs}ms` +
          ` [${totalInputTokens}in/${totalOutputTokens}out tokens, ${toolRound} tool round(s)]`,
      );
      await this.maybeGenerateTitle(conversation);
      this.repo.updateConversation(conversationId, {});
    } catch (error: unknown) {
      if (abortController.signal.aborted) {
        this.insertCancelledAssistantMessage(conversationId);
        return;
      }
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      await emit('error', { message: error instanceof Error ? error.message : 'Stream failed' });
    } finally {
      this.endStreamSession(conversationId);
    }
  }

  private async runSingleModelStream(params: {
    conversation: ChatConversation;
    provider: AgentProvider;
    systemPrompt: string;
    messages: InternalMessage[];
    signal: AbortSignal;
    emit: StreamCallback;
  }): Promise<{
    assistantText: string;
    pendingToolCalls: PendingToolCall[];
    roundInputTokens: number;
    roundOutputTokens: number;
  }> {
    const { conversation, provider, systemPrompt, messages, signal, emit } = params;
    const pendingToolCalls: PendingToolCall[] = [];
    let assistantText = '';
    let roundInputTokens = 0;
    let roundOutputTokens = 0;

    const stream = streamChat(provider, conversation.model ?? 'default', systemPrompt, messages, CHAT_TOOLS, signal);

    for await (const event of stream) {
      if (signal.aborted) break;

      switch (event.type) {
        case 'text_delta':
          assistantText += event.text;
          await emit('text_delta', { text: event.text });
          break;
        case 'tool_call':
          pendingToolCalls.push({ id: event.id, name: event.name, args: event.args });
          await emit('tool_call', { id: event.id, name: event.name, args: event.args });
          break;
        case 'usage':
          roundInputTokens += event.inputTokens;
          roundOutputTokens += event.outputTokens;
          break;
        case 'tool_call_done':
        case 'done':
          break;
      }
    }

    return { assistantText, pendingToolCalls, roundInputTokens, roundOutputTokens };
  }

  private async persistToolRoundAndExecute(
    conversationId: string,
    conversation: ChatConversation,
    assistantText: string,
    pendingToolCalls: PendingToolCall[],
    emit: StreamCallback,
    mentionedAgentId?: string | null,
  ): Promise<InternalMessage[]> {
    this.repo.insertMessage({
      conversationId,
      role: 'assistant',
      content: assistantText,
      toolCalls: pendingToolCalls,
    });

    const projectContext = await this.getProjectContext(conversation.projectId, mentionedAgentId);

    for (const tc of pendingToolCalls) {
      const result = await executeTool(tc.name, tc.args, projectContext);
      await emit('tool_result', { toolCallId: tc.id, name: tc.name, result });

      this.repo.insertMessage({
        conversationId,
        role: 'tool',
        content: JSON.stringify(result),
        toolResults: [{ toolCallId: tc.id, result }],
      });
    }

    return this.toInternalMessages(this.repo.findMessagesByConversation(conversationId));
  }

  private async sendMessageCli(
    conversation: ChatConversation,
    content: string,
    emit: StreamCallback,
    mentionedAgent: { id: string; name: string } | null,
  ): Promise<void> {
    const FUNCTION_NAME = 'sendMessageCli';
    const conversationId = conversation.id;

    if (!conversation.executorId) {
      await emit('error', { message: 'No CLI executor configured for this conversation' });
      return;
    }

    const executor = executorRegistry.getById(conversation.executorId);
    if (!executor) {
      await emit('error', { message: `CLI executor "${conversation.executorId}" not found` });
      return;
    }

    const abortController = this.beginStreamSession(conversationId);

    try {
      const startMs = Date.now();
      logger.info(
        `${FILE_PATH} :: ${FUNCTION_NAME} - start [conv=${conversationId}, executor=${conversation.executorId}]`,
      );
      const systemPrompt = await buildChatSystemPrompt(conversation.projectId, mentionedAgent);
      const history = this.repo.findMessagesByConversation(conversationId);
      const previousMessages = history
        .filter((m) => m.role !== 'tool')
        .slice(0, -1)
        .map((m) => ({ role: m.role, content: m.content }));

      const fullPrompt = formatCliPrompt(systemPrompt, previousMessages, content);

      let projectCwd: string | undefined;
      if (conversation.projectId) {
        try {
          const { project } = await projectsService.getContext(conversation.projectId);
          projectCwd = project.localPath ?? undefined;
        } catch (error: unknown) {
          logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} failed to resolve project cwd`, error);
        }
      }

      await emit('text_delta', { text: '' });

      const result = await streamCliChat(
        {
          executor,
          prompt: fullPrompt,
          cwd: projectCwd,
          model: conversation.model ?? executor.defaultModel,
          signal: abortController.signal,
        },
        (chunk) => {
          emit('text_delta', { text: chunk });
        },
      );

      const savedMsg = this.repo.insertMessage({
        conversationId,
        role: 'assistant',
        content: result.text,
      });

      await emit('done', { messageId: savedMsg.id });

      logger.info(`${FILE_PATH} :: ${FUNCTION_NAME} - done in ${Date.now() - startMs}ms`);
      await this.maybeGenerateTitle(conversation);
      this.repo.updateConversation(conversationId, {});
    } catch (error: unknown) {
      if (abortController.signal.aborted) {
        this.insertCancelledAssistantMessage(conversationId);
        return;
      }
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      await emit('error', { message: error instanceof Error ? error.message : 'CLI chat failed' });
    } finally {
      this.endStreamSession(conversationId);
    }
  }

  private toInternalMessages(messages: ChatMessage[]): InternalMessage[] {
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

  private async getProjectContext(projectId: string | null, mentionedAgentId?: string | null): Promise<ToolContext> {
    if (!projectId) return { mentionedAgentId };
    try {
      const { project } = await projectsService.getContext(projectId);
      return { projectId, projectLocalPath: project.localPath ?? null, mentionedAgentId };
    } catch (error: unknown) {
      logger.warn(`${FILE_PATH} :: getProjectContext failed`, error);
      return { projectId, mentionedAgentId };
    }
  }

  private async maybeGenerateTitle(conversation: ChatConversation): Promise<void> {
    if (conversation.title) return;

    const messages = this.repo.findMessagesByConversation(conversation.id);
    const firstUserMsg = messages.find((m) => m.role === 'user');
    if (!firstUserMsg) return;

    // Prefer text content; fall back to the first attachment name for attachment-only messages
    const rawTitle =
      firstUserMsg.content.trim() ||
      (firstUserMsg.attachments?.[0] ? `[${firstUserMsg.attachments[0].name}]` : 'New conversation');

    const title = rawTitle.slice(0, 50) + (rawTitle.length > 50 ? '...' : '');
    this.repo.updateConversation(conversation.id, { title });
  }
}
