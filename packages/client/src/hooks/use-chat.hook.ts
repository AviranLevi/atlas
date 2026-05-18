// React / library
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

// Lib
import { api } from '@/lib/api';

// Contexts
import { useChatStreamContext } from '@/contexts/ChatStreamContext';

// Types
import type {
  ChatAttachment,
  ChatConversation,
  ChatMessage,
  CreateConversation,
  ExecutionMode,
  UpdateConversationConfig,
} from '@atlas/shared';
import type { ChatStreamState, StreamingToolCall, UIResourceItem } from '@/pages/chat/chat.types';
import type { StreamSession } from '@/contexts/chat-stream-context.types';

export type { ChatStreamState, StreamingToolCall, UIResourceItem } from '@/pages/chat/chat.types';

const CONVERSATIONS_KEY = ['chat-conversations'] as const;
const MESSAGES_KEY = ['chat-messages'] as const;

export function useConversations(projectId?: string | null) {
  const params = projectId ? `?projectId=${projectId}` : '';
  return useQuery({
    queryKey: [...CONVERSATIONS_KEY, projectId],
    queryFn: () => api.get<ChatConversation[]>(`/chat/conversations${params}`),
  });
}

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: [...CONVERSATIONS_KEY, id],
    queryFn: () => api.get<ChatConversation>(`/chat/conversations/${id}`),
    enabled: !!id,
  });
}

/**
 * Returns messages for a conversation.
 *
 * Polling rules:
 *   - Empty conversation: poll every 1.5s. Catches the race where the cache
 *     was populated as `[]` before the streaming POST persisted the user
 *     message (otherwise the UI sticks on a blank state forever — no message,
 *     no thinking indicator).
 *   - Last message from user: poll every 2s while waiting for the assistant
 *     response (so navigating away and back still picks up the eventual reply
 *     or cancelled placeholder).
 *   - Last message from assistant: stop polling.
 *
 * `refetchOnMount: 'always'` ensures we revalidate every time the hook
 * subscribes for a new conversationId, even if cached data exists.
 */
export function useConversationMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: [...MESSAGES_KEY, conversationId],
    queryFn: () => api.get<ChatMessage[]>(`/chat/conversations/${conversationId}/messages`),
    enabled: !!conversationId,
    refetchOnMount: 'always',
    refetchInterval: (query) => {
      const msgs = query.state.data;
      if (!msgs) return false;
      if (msgs.length === 0) return 1500;
      const lastRole = msgs[msgs.length - 1]?.role;
      return lastRole === 'user' ? 2000 : false;
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateConversation) => api.post<ChatConversation>('/chat/conversations', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY }),
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/chat/conversations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY }),
  });
}

/** Updates the execution mode for a conversation. */
export function useUpdateConversationMode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, executionMode }: { id: string; executionMode: ExecutionMode | null }) =>
      api.patch<ChatConversation>(`/chat/conversations/${id}/mode`, { executionMode }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [...CONVERSATIONS_KEY, id] });
    },
  });
}

/** Updates provider/executor/model for an existing conversation. */
export function useUpdateConversationConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateConversationConfig }) =>
      api.patch<ChatConversation>(`/chat/conversations/${id}/config`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [...CONVERSATIONS_KEY, id] });
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });
}

const DEFAULT_SESSION: StreamSession = {
  state: 'idle',
  streamingText: '',
  toolCalls: [],
  uiResources: [],
  error: null,
  pendingUserMessage: null,
};

/** Thin selector over ChatStreamContext. Subscribes to session updates for the given conversation. */
export function useChatStream(conversationId: string | undefined) {
  const { getSession, subscribe, start, abort, clearError } = useChatStreamContext();

  const [session, setSession] = useState<StreamSession>(() =>
    conversationId ? getSession(conversationId) : DEFAULT_SESSION,
  );

  // Sync state immediately when switching conversations (handles re-mount after navigation)
  useEffect(() => {
    setSession(conversationId ? getSession(conversationId) : DEFAULT_SESSION);
  }, [conversationId, getSession]);

  // Subscribe to live updates for this conversation
  useEffect(() => {
    if (!conversationId) return;
    return subscribe(conversationId, setSession);
  }, [conversationId, subscribe]);

  const send = useCallback(
    (content: string, attachments?: ChatAttachment[], mentionedAgentId?: string) => {
      if (conversationId) start(conversationId, content, attachments, mentionedAgentId);
    },
    [conversationId, start],
  );

  const doAbort = useCallback(() => {
    if (conversationId) abort(conversationId);
  }, [conversationId, abort]);

  const doClearError = useCallback(() => {
    if (conversationId) clearError(conversationId);
  }, [conversationId, clearError]);

  return {
    state: session.state,
    streamingText: session.streamingText,
    toolCalls: session.toolCalls,
    uiResources: session.uiResources,
    error: session.error,
    pendingUserMessage: session.pendingUserMessage,
    send,
    abort: doAbort,
    clearError: doClearError,
  };
}
