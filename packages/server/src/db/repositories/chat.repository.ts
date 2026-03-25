// External
import { desc, eq } from 'drizzle-orm';

// Shared
import type { ChatConversation, ChatMessage, CreateConversation } from '@my-agents/shared';

// DB
import type { DB } from '../index.js';
import { chatConversations, chatMessages } from '../schema/index.js';

// Lib
import { logger } from '../../lib/logger.js';
import { AppError, NotFoundError } from '../../lib/errors.js';

const FILE_PATH = 'db/repositories/chat.repository.ts';

function parseMessage(row: Record<string, unknown>): ChatMessage {
  return {
    ...row,
    toolCalls: typeof row.toolCalls === 'string' ? JSON.parse(row.toolCalls) : row.toolCalls ?? null,
    toolResults:
      typeof row.toolResults === 'string' ? JSON.parse(row.toolResults) : row.toolResults ?? null,
  } as ChatMessage;
}

export class ChatRepository {
  constructor(private readonly db: DB) {}

  /** Lists conversations, optionally filtered by project, newest first. */
  findAllConversations(projectId?: string | null): ChatConversation[] {
    const FUNCTION_NAME = 'findAllConversations';
    try {
      if (projectId) {
        return this.db
          .select()
          .from(chatConversations)
          .where(eq(chatConversations.projectId, projectId))
          .orderBy(desc(chatConversations.updatedAt))
          .all() as ChatConversation[];
      }
      return this.db
        .select()
        .from(chatConversations)
        .orderBy(desc(chatConversations.updatedAt))
        .all() as ChatConversation[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list conversations', { cause: error });
    }
  }

  /** Returns a conversation by ID, or null if not found. */
  findConversationById(id: string): ChatConversation | null {
    const FUNCTION_NAME = 'findConversationById';
    try {
      const row = this.db.select().from(chatConversations).where(eq(chatConversations.id, id)).get();
      return (row as ChatConversation) ?? null;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get conversation', { cause: error });
    }
  }

  /** Returns a conversation by ID or throws NotFoundError. */
  findConversationByIdOrThrow(id: string): ChatConversation {
    const row = this.findConversationById(id);
    if (!row) throw new NotFoundError('ChatConversation', id);
    return row;
  }

  /** Inserts a conversation and returns the created row. */
  insertConversation(data: CreateConversation): ChatConversation {
    const FUNCTION_NAME = 'insertConversation';
    try {
      return this.db.insert(chatConversations).values(data).returning().get() as ChatConversation;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to create conversation', { cause: error });
    }
  }

  /** Updates a conversation title and/or bumps updatedAt. */
  updateConversation(
    id: string,
    data: Partial<{ title: string; updatedAt: string }>,
  ): ChatConversation {
    const FUNCTION_NAME = 'updateConversation';
    try {
      return this.db
        .update(chatConversations)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(chatConversations.id, id))
        .returning()
        .get() as ChatConversation;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update conversation', { cause: error });
    }
  }

  /** Deletes a conversation and its messages. */
  removeConversation(id: string): void {
    const FUNCTION_NAME = 'removeConversation';
    try {
      this.db.delete(chatMessages).where(eq(chatMessages.conversationId, id)).run();
      this.db.delete(chatConversations).where(eq(chatConversations.id, id)).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete conversation', { cause: error });
    }
  }

  /** Lists messages for a conversation in chronological order. */
  findMessagesByConversation(conversationId: string): ChatMessage[] {
    const FUNCTION_NAME = 'findMessagesByConversation';
    try {
      const rows = this.db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, conversationId))
        .orderBy(chatMessages.createdAt)
        .all();
      return rows.map((r) => parseMessage(r as Record<string, unknown>));
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list messages', { cause: error });
    }
  }

  /** Appends a message to a conversation. */
  insertMessage(data: {
    conversationId: string;
    role: string;
    content: string;
    toolCalls?: unknown[] | null;
    toolResults?: unknown[] | null;
  }): ChatMessage {
    const FUNCTION_NAME = 'insertMessage';
    try {
      const values = {
        conversationId: data.conversationId,
        role: data.role,
        content: data.content,
        toolCalls: data.toolCalls ? JSON.stringify(data.toolCalls) : null,
        toolResults: data.toolResults ? JSON.stringify(data.toolResults) : null,
      };
      const result = this.db.insert(chatMessages).values(values).returning().get();
      return parseMessage(result as Record<string, unknown>);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to insert message', { cause: error });
    }
  }
}
