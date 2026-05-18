// Types
import type { ChatAttachment } from '@atlas/shared';
import type { ChatStreamState, StreamingToolCall, UIResourceItem } from '@/pages/chat/chat.types';

export type StreamSession = {
  state: ChatStreamState;
  streamingText: string;
  toolCalls: StreamingToolCall[];
  uiResources: UIResourceItem[];
  error: string | null;
  pendingUserMessage: string | null;
};

export type ChatStreamContextValue = {
  /** Returns the current session snapshot for the given conversation, or a default idle session. */
  getSession(conversationId: string): StreamSession;
  /**
   * Subscribes to session updates for a conversation.
   * Returns an unsubscribe function.
   */
  subscribe(conversationId: string, listener: (session: StreamSession) => void): () => void;
  /** Starts a new SSE stream for the conversation. No-op if already streaming. */
  start(conversationId: string, content: string, attachments?: ChatAttachment[], mentionedAgentId?: string): void;
  /** Aborts the in-flight stream for the conversation, also killing the server-side run. */
  abort(conversationId: string): void;
  /** Clears the error state for the conversation. */
  clearError(conversationId: string): void;
  /** Set of conversation IDs that are currently streaming. */
  activeStreamingIds: ReadonlySet<string>;
};
