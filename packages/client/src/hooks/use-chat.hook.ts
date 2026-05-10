// React / library
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

// Lib
import { api } from '@/lib/api';

// Types
import type { ChatAttachment, ChatConversation, ChatMessage, CreateConversation, ExecutionMode } from '@atlas/shared';
import type { ChatStreamState, StreamingToolCall } from '@/pages/chat/chat.types';

export type { ChatStreamState, StreamingToolCall } from '@/pages/chat/chat.types';

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

export function useChatStream(conversationId: string | undefined) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<ChatStreamState>('idle');
  const [streamingText, setStreamingText] = useState('');
  const [toolCalls, setToolCalls] = useState<StreamingToolCall[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Reset all streaming state when switching conversations so the previous
  // conversation's in-flight content never bleeds into the next one.
  // conversationId is intentionally the only dep — it's a trigger, not a value read inside the effect.
  // biome-ignore lint/correctness/useExhaustiveDependencies: conversationId is the change trigger
  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState('idle');
    setStreamingText('');
    setToolCalls([]);
    setError(null);
    setPendingUserMessage(null);
  }, [conversationId]);

  const send = useCallback(
    async (content: string, attachments?: ChatAttachment[], mentionedAgentId?: string) => {
      if (!conversationId || state === 'streaming') return;

      setPendingUserMessage(content);
      setState('streaming');
      setStreamingText('');
      setToolCalls([]);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const body: Record<string, unknown> = { content };
        if (attachments?.length) body.attachments = attachments;
        if (mentionedAgentId) body.mentionedAgentId = mentionedAgentId;
        const resp = await api.stream(`/chat/conversations/${conversationId}/messages`, body, controller.signal);

        if (!resp.ok) {
          const body = await resp.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(body.error || `HTTP ${resp.status}`);
        }

        const reader = resp.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          let currentEvent = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              const json = line.slice(6).trim();
              if (!json) continue;
              try {
                const data = JSON.parse(json);
                handleEvent(currentEvent, data);
              } catch {
                /* skip malformed */
              }
            }
          }
        }

        setState('idle');
        setPendingUserMessage(null);
        queryClient.invalidateQueries({ queryKey: [...MESSAGES_KEY, conversationId] });
        queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      } catch (err: unknown) {
        if (controller.signal.aborted) {
          setState('idle');
          setPendingUserMessage(null);
          return;
        }
        const message = err instanceof Error ? err.message : 'Stream failed';
        setError(message);
        setState('error');
        setPendingUserMessage(null);
      } finally {
        abortRef.current = null;
      }

      function handleEvent(event: string, data: Record<string, unknown>) {
        switch (event) {
          case 'text_delta':
            setStreamingText((prev) => prev + (data.text as string));
            break;
          case 'tool_call':
            setToolCalls((prev) => [
              ...prev,
              {
                id: data.id as string,
                name: data.name as string,
                args: data.args as Record<string, unknown>,
                status: 'pending',
              },
            ]);
            break;
          case 'tool_result':
            setToolCalls((prev) =>
              prev.map((tc) =>
                tc.id === data.toolCallId ? { ...tc, result: data.result, status: 'done' as const } : tc,
              ),
            );
            break;
          case 'error':
            setError(data.message as string);
            setState('error');
            break;
          case 'done':
            setStreamingText('');
            setToolCalls([]);
            break;
        }
      }
    },
    [conversationId, state, queryClient],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
    if (conversationId) {
      api.fireAndForget(`/chat/conversations/${conversationId}/stream`);
    }
    setState('idle');
    setStreamingText('');
    setPendingUserMessage(null);
  }, [conversationId]);

  const clearError = useCallback(() => {
    setError(null);
    setState('idle');
  }, []);

  return { state, streamingText, toolCalls, error, send, abort, clearError, pendingUserMessage };
}
