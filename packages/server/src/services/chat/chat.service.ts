/**
 * Chat orchestration: persists messages, streams model output through an SSE-style emit callback.
 * API path: provider streaming with multi-round tool execution. CLI path: formatCliPrompt + streamCliChat.
 * Streaming failures use emit('error', …) rather than AppError so the HTTP layer can keep the stream contract.
 */

// Shared
import type {
  AgentProvider,
  ChatAttachment,
  ChatConversation,
  ChatMessage,
  CreateConversation,
  ExecutionMode,
  UpdateConversationConfig,
} from '@atlas/shared';

// Services
import { agentProvidersService, agentsService, projectsService, usageService } from '../index.js';

// Executors
import { executorRegistry } from '../../executors/index.js';

// Repositories
import { chatRepository } from '../../db/repositories/index.js';

// Lib
import {
  type InternalMessage,
  CHAT_TOOLS,
  executeTool,
  formatCliPrompt,
  getToolsForMode,
  streamChat,
  streamCliChat,
} from '../../lib/chat/index.js';
import { isUICardResult } from '../../lib/chat-ui/index.js';
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

import { buildChatSystemPrompt } from './chat-system-prompt.js';
import { getProjectContext, toInternalMessages } from './chat-context.js';
import { ChatStreamSessions } from './chat-stream-session.js';
import { maybeGenerateTitle } from './chat-title.js';

const FILE_PATH = 'services/chat/chat.service.ts';
const MAX_TOOL_ROUNDS = 10;

type StreamCallback = (event: string, data: unknown) => void | Promise<void>;

type PendingToolCall = { id: string; name: string; args: Record<string, unknown>; metadata?: Record<string, unknown> };

export class ChatService {
  private readonly repo = chatRepository;
  private readonly sessions = new ChatStreamSessions();

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

  /** Updates the execution mode override for a conversation. */
  async updateConversationMode(id: string, executionMode: string | null): Promise<ChatConversation> {
    this.repo.findConversationByIdOrThrow(id);
    return this.repo.updateConversation(id, { executionMode });
  }

  /** Updates provider/executor/model for a conversation. Backend type is immutable post-creation. */
  async updateConversationConfig(id: string, data: UpdateConversationConfig): Promise<ChatConversation> {
    const FUNCTION_NAME = 'updateConversationConfig';
    try {
      const existing = this.repo.findConversationByIdOrThrow(id);
      if (existing.backendType === 'api' && data.executorId) {
        throw new AppError('Cannot set executorId on an API conversation', { status: 400 });
      }
      if (existing.backendType === 'cli' && data.providerId) {
        throw new AppError('Cannot set providerId on a CLI conversation', { status: 400 });
      }
      return this.repo.updateConversation(id, data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw error instanceof AppError ? error : new AppError('Failed to update conversation config', { cause: error });
    }
  }

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    return this.repo.findMessagesByConversation(conversationId);
  }

  abortStream(conversationId: string): void {
    this.sessions.abort(conversationId);
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

  /** Resolves effective execution mode: conversation override → agent default → system default (confirm). */
  private async resolveExecutionMode(
    conversation: ChatConversation,
    mentionedAgentId?: string | null,
  ): Promise<ExecutionMode> {
    if (conversation.executionMode) {
      return conversation.executionMode as ExecutionMode;
    }
    if (mentionedAgentId) {
      try {
        const agent = await agentsService.getById(mentionedAgentId);
        if (agent.executionMode) return agent.executionMode as ExecutionMode;
      } catch {
        /* agent not found — fall through */
      }
    }
    return 'confirm';
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
    const abortController = this.sessions.begin(conversationId);

    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    try {
      const startMs = Date.now();
      logger.info(`${FILE_PATH} :: ${FUNCTION_NAME} - start [conv=${conversationId}]`);
      const executionMode = await this.resolveExecutionMode(conversation, mentionedAgent?.id);
      const systemPrompt = await buildChatSystemPrompt(conversation.projectId, mentionedAgent, executionMode);
      let messages = toInternalMessages(this.repo.findMessagesByConversation(conversationId));

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
            executionMode,
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
      maybeGenerateTitle(conversation);
      this.repo.updateConversation(conversationId, {});
    } catch (error: unknown) {
      if (abortController.signal.aborted) {
        this.sessions.insertCancelledAssistantMessage(conversationId);
        return;
      }
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      await emit('error', { message: error instanceof Error ? error.message : 'Stream failed' });
    } finally {
      this.sessions.end(conversationId);
    }
  }

  private async runSingleModelStream(params: {
    conversation: ChatConversation;
    provider: AgentProvider;
    systemPrompt: string;
    messages: InternalMessage[];
    executionMode: ExecutionMode;
    signal: AbortSignal;
    emit: StreamCallback;
  }): Promise<{
    assistantText: string;
    pendingToolCalls: PendingToolCall[];
    roundInputTokens: number;
    roundOutputTokens: number;
  }> {
    const { conversation, provider, systemPrompt, messages, executionMode, signal, emit } = params;
    const pendingToolCalls: PendingToolCall[] = [];
    let assistantText = '';
    let roundInputTokens = 0;
    let roundOutputTokens = 0;

    const tools = getToolsForMode(executionMode);
    const stream = streamChat(provider, conversation.model ?? 'default', systemPrompt, messages, tools, signal);

    for await (const event of stream) {
      if (signal.aborted) break;

      switch (event.type) {
        case 'text_delta':
          assistantText += event.text;
          await emit('text_delta', { text: event.text });
          break;
        case 'tool_call':
          pendingToolCalls.push({ id: event.id, name: event.name, args: event.args, metadata: event.metadata });
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

    const projectContext = await getProjectContext(conversation.projectId, mentionedAgentId);

    for (const tc of pendingToolCalls) {
      const rawResult = await executeTool(tc.name, tc.args, projectContext);

      // Detect UI card results — emit extra ui_resource event and persist html alongside data.
      let persistedResult: unknown = rawResult;
      if (isUICardResult(rawResult)) {
        await emit('ui_resource', { toolCallId: tc.id, toolName: tc.name, html: rawResult.html });
        persistedResult = {
          ...((rawResult.data as Record<string, unknown>) ?? {}),
          __uiHtml: rawResult.html,
          __uiToolName: tc.name,
        };
      }

      await emit('tool_result', { toolCallId: tc.id, name: tc.name, result: persistedResult });

      this.repo.insertMessage({
        conversationId,
        role: 'tool',
        content: JSON.stringify(persistedResult),
        toolResults: [{ toolCallId: tc.id, result: persistedResult }],
      });
    }

    return toInternalMessages(this.repo.findMessagesByConversation(conversationId));
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

    const abortController = this.sessions.begin(conversationId);

    try {
      const startMs = Date.now();
      logger.info(
        `${FILE_PATH} :: ${FUNCTION_NAME} - start [conv=${conversationId}, executor=${conversation.executorId}]`,
      );
      const executionMode = await this.resolveExecutionMode(conversation, mentionedAgent?.id);
      const systemPrompt = await buildChatSystemPrompt(conversation.projectId, mentionedAgent, executionMode);
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
      maybeGenerateTitle(conversation);
      this.repo.updateConversation(conversationId, {});
    } catch (error: unknown) {
      if (abortController.signal.aborted) {
        this.sessions.insertCancelledAssistantMessage(conversationId);
        return;
      }
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      await emit('error', { message: error instanceof Error ? error.message : 'CLI chat failed' });
    } finally {
      this.sessions.end(conversationId);
    }
  }
}
