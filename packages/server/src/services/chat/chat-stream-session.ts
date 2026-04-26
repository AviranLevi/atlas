// Repositories
import { chatRepository } from '../../db/repositories/index.js';

/**
 * Tracks in-flight streaming sessions per conversation so the HTTP layer
 * can abort an active model stream when the client cancels mid-response.
 */
export class ChatStreamSessions {
  private active = new Map<string, AbortController>();

  begin(conversationId: string): AbortController {
    const controller = new AbortController();
    this.active.set(conversationId, controller);
    return controller;
  }

  end(conversationId: string): void {
    this.active.delete(conversationId);
  }

  abort(conversationId: string): void {
    const controller = this.active.get(conversationId);
    if (controller) {
      controller.abort();
      this.active.delete(conversationId);
    }
  }

  /** Avoids leaving the last message as user-only when the client aborts mid-stream. */
  insertCancelledAssistantMessage(conversationId: string): void {
    chatRepository.insertMessage({
      conversationId,
      role: 'assistant',
      content: '(response cancelled)',
    });
  }
}
