import type { ChatConversation, ChatMessage, CreateConversation } from '@atlas/shared';

import { chatRepository } from '../../db/repositories/index.js';
import { agentProvidersService, settingsService, projectsService, memoryService, usageService } from '../index.js';
import { streamChat, type InternalMessage, CHAT_TOOLS, executeTool, streamCliChat, formatCliPrompt } from '../../lib/chat/index.js';
import { executorRegistry } from '../../executors/index.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'services/chat/chat.service.ts';
const MAX_TOOL_ROUNDS = 10;
const MAX_RECENT_MEMORIES = 5;

type StreamCallback = (event: string, data: unknown) => void | Promise<void>;

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
  ): Promise<void> {
    const conversation = this.repo.findConversationByIdOrThrow(conversationId);
    this.repo.insertMessage({ conversationId, role: 'user', content });

    if (conversation.backendType === 'cli') {
      await this.sendMessageCli(conversation, content, emit);
    } else {
      await this.sendMessageApi(conversation, content, emit);
    }
  }

  private async sendMessageApi(
    conversation: ChatConversation,
    content: string,
    emit: StreamCallback,
  ): Promise<void> {
    const FUNCTION_NAME = 'sendMessageApi';
    const conversationId = conversation.id;

    if (!conversation.providerId) {
      await emit('error', { message: 'No provider configured for this conversation' });
      return;
    }

    const provider = await agentProvidersService.getById(conversation.providerId);

    const abortController = new AbortController();
    this.activeStreams.set(conversationId, abortController);

    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    try {
      const systemPrompt = await this.buildSystemPrompt(conversation.projectId);
      const history = this.repo.findMessagesByConversation(conversationId);
      let messages = this.toInternalMessages(history);

      let toolRound = 0;
      let done = false;

      while (!done && toolRound < MAX_TOOL_ROUNDS) {
        if (abortController.signal.aborted) break;

        const pendingToolCalls: { id: string; name: string; args: Record<string, unknown> }[] = [];
        let assistantText = '';

        const stream = streamChat(
          provider,
          conversation.model ?? 'default',
          systemPrompt,
          messages,
          CHAT_TOOLS,
          abortController.signal,
        );

        for await (const event of stream) {
          if (abortController.signal.aborted) break;

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
              totalInputTokens += event.inputTokens;
              totalOutputTokens += event.outputTokens;
              break;
            case 'done':
              if (pendingToolCalls.length === 0) {
                done = true;
              }
              break;
          }
        }

        if (abortController.signal.aborted) break;

        if (pendingToolCalls.length > 0) {
          this.repo.insertMessage({
            conversationId,
            role: 'assistant',
            content: assistantText,
            toolCalls: pendingToolCalls,
          });

          const projectContext = await this.getProjectContext(conversation.projectId);

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

          messages = this.toInternalMessages(
            this.repo.findMessagesByConversation(conversationId),
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

      await this.maybeGenerateTitle(conversation);
      this.repo.updateConversation(conversationId, {});
    } catch (error: unknown) {
      if (abortController.signal.aborted) return;
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      await emit('error', { message: error instanceof Error ? error.message : 'Stream failed' });
    } finally {
      this.activeStreams.delete(conversationId);
    }
  }

  private async sendMessageCli(
    conversation: ChatConversation,
    content: string,
    emit: StreamCallback,
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

    const abortController = new AbortController();
    this.activeStreams.set(conversationId, abortController);

    try {
      const systemPrompt = await this.buildSystemPrompt(conversation.projectId);
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
        } catch {
          // Fall through to default cwd
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
        (chunk) => { emit('text_delta', { text: chunk }); },
      );

      const savedMsg = this.repo.insertMessage({
        conversationId,
        role: 'assistant',
        content: result.text,
      });

      await emit('done', { messageId: savedMsg.id });

      await this.maybeGenerateTitle(conversation);
      this.repo.updateConversation(conversationId, {});
    } catch (error: unknown) {
      if (abortController.signal.aborted) return;
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      await emit('error', { message: error instanceof Error ? error.message : 'CLI chat failed' });
    } finally {
      this.activeStreams.delete(conversationId);
    }
  }

  private async buildSystemPrompt(projectId: string | null): Promise<string> {
    const sections: string[] = [];

    sections.push(
      'You are a helpful AI assistant integrated into a project management and AI agent orchestration platform. ' +
      'You can answer questions about the project, create tasks, agents, rules, skills, and memories using the available tools. ' +
      'Be concise and direct. When creating entities, confirm what you created.',
    );

    const globalInstructions = await settingsService.listGlobalInstructions();
    if (globalInstructions.length > 0) {
      const content = globalInstructions.map((gi) => gi.content).filter(Boolean).join('\n\n');
      if (content) sections.push(`## Global Instructions\n\n${content}`);
    }

    if (projectId) {
      try {
        const { project } = await projectsService.getContext(projectId);

        if (project.projectBrief) {
          sections.push(`## Project Context\n\n${project.projectBrief}`);
        } else {
          const projLines: string[] = [`## Project: ${project.name}`];
          if (project.description) projLines.push(project.description);
          if (project.techStack) projLines.push(`**Tech Stack:** ${project.techStack}`);
          sections.push(projLines.join('\n'));
        }

        if (project.scanData) {
          const sd = project.scanData;
          const scanLines: string[] = [];
          if (sd.languages?.length) scanLines.push(`**Languages:** ${sd.languages.join(', ')}`);
          if (sd.packageManager) scanLines.push(`**Package Manager:** ${sd.packageManager}`);
          if (sd.projectType) scanLines.push(`**Type:** ${sd.projectType}`);
          if (sd.keyDirectories && Object.keys(sd.keyDirectories).length > 0) {
            const dirs = Object.entries(sd.keyDirectories).map(([k, v]) => `${k}: \`${v}\``).join(', ');
            scanLines.push(`**Key Directories:** ${dirs}`);
          }
          if (scanLines.length > 0) {
            sections.push(`## Project Structure\n\n${scanLines.join('\n')}`);
          }
        }

        const allMemories = await memoryService.listByProject(projectId);
        const recentMemories = allMemories
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, MAX_RECENT_MEMORIES);
        if (recentMemories.length > 0) {
          const memList = recentMemories
            .map((m) => `- [${m.type}] **${m.name}**: ${m.content}`)
            .join('\n');
          sections.push(`## Recent Project Knowledge\n\n${memList}`);
        }
      } catch {
        // Project context not available -- continue without it
      }
    }

    return sections.join('\n\n---\n\n');
  }

  private toInternalMessages(messages: ChatMessage[]): InternalMessage[] {
    return messages.map((m) => {
      if (m.role === 'user') return { role: 'user' as const, content: m.content };
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

  private async getProjectContext(projectId: string | null): Promise<{ projectId?: string | null; projectLocalPath?: string | null }> {
    if (!projectId) return {};
    try {
      const { project } = await projectsService.getContext(projectId);
      return { projectId, projectLocalPath: project.localPath ?? null };
    } catch {
      return { projectId };
    }
  }

  private async maybeGenerateTitle(conversation: ChatConversation): Promise<void> {
    if (conversation.title) return;

    const messages = this.repo.findMessagesByConversation(conversation.id);
    const firstUserMsg = messages.find((m) => m.role === 'user');
    if (!firstUserMsg) return;

    const title = firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '');
    this.repo.updateConversation(conversation.id, { title });
  }
}
