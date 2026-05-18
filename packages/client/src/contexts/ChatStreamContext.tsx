// React / library
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// Lib
import { api } from '@/lib/api';

// Types
import type { ChatAttachment } from '@atlas/shared';
import type { StreamSession, ChatStreamContextValue } from './chat-stream-context.types';

const DEFAULT_SESSION: StreamSession = {
  state: 'idle',
  streamingText: '',
  toolCalls: [],
  uiResources: [],
  error: null,
  pendingUserMessage: null,
};

const MESSAGES_KEY = ['chat-messages'] as const;
const CONVERSATIONS_KEY = ['chat-conversations'] as const;

const ChatStreamCtx = createContext<ChatStreamContextValue | null>(null);

export function ChatStreamProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const sessionsRef = useRef<Map<string, StreamSession>>(new Map());
  const listenersRef = useRef<Map<string, Set<(s: StreamSession) => void>>>(new Map());
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const [activeStreamingIds, setActiveStreamingIds] = useState<ReadonlySet<string>>(new Set());

  const updateSession = useCallback((id: string, updater: (s: StreamSession) => StreamSession) => {
    const current = sessionsRef.current.get(id) ?? DEFAULT_SESSION;
    const next = updater(current);
    sessionsRef.current.set(id, next);
    listenersRef.current.get(id)?.forEach((fn) => {
      fn(next);
    });
  }, []);

  const getSession = useCallback((id: string): StreamSession => {
    return sessionsRef.current.get(id) ?? DEFAULT_SESSION;
  }, []);

  const subscribe = useCallback((id: string, listener: (s: StreamSession) => void): (() => void) => {
    if (!listenersRef.current.has(id)) {
      listenersRef.current.set(id, new Set());
    }
    listenersRef.current.get(id)!.add(listener);
    return () => {
      listenersRef.current.get(id)?.delete(listener);
    };
  }, []);

  const abort = useCallback(
    (id: string) => {
      const controller = abortControllersRef.current.get(id);
      if (controller) {
        controller.abort();
        abortControllersRef.current.delete(id);
        api.fireAndForget(`/chat/conversations/${id}/stream`);
      }
      updateSession(id, (s) => ({ ...s, state: 'idle', streamingText: '', pendingUserMessage: null }));
      setActiveStreamingIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [updateSession],
  );

  const clearError = useCallback(
    (id: string) => {
      updateSession(id, (s) => ({ ...s, error: null, state: 'idle' }));
    },
    [updateSession],
  );

  const start = useCallback(
    async (id: string, content: string, attachments?: ChatAttachment[], mentionedAgentId?: string) => {
      if (abortControllersRef.current.has(id)) return;

      updateSession(id, () => ({
        state: 'streaming',
        streamingText: '',
        toolCalls: [],
        uiResources: [],
        error: null,
        pendingUserMessage: content,
      }));

      const controller = new AbortController();
      abortControllersRef.current.set(id, controller);
      setActiveStreamingIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });

      function handleEvent(event: string, data: Record<string, unknown>) {
        switch (event) {
          case 'text_delta':
            updateSession(id, (s) => ({ ...s, streamingText: s.streamingText + (data.text as string) }));
            break;
          case 'tool_call':
            updateSession(id, (s) => ({
              ...s,
              toolCalls: [
                ...s.toolCalls,
                {
                  id: data.id as string,
                  name: data.name as string,
                  args: data.args as Record<string, unknown>,
                  status: 'pending' as const,
                },
              ],
            }));
            break;
          case 'tool_result':
            updateSession(id, (s) => ({
              ...s,
              toolCalls: s.toolCalls.map((tc) =>
                tc.id === data.toolCallId ? { ...tc, result: data.result, status: 'done' as const } : tc,
              ),
            }));
            break;
          case 'ui_resource':
            updateSession(id, (s) => ({
              ...s,
              uiResources: [
                ...s.uiResources,
                {
                  toolCallId: data.toolCallId as string,
                  toolName: data.toolName as string,
                  html: data.html as string,
                },
              ],
            }));
            break;
          case 'error':
            updateSession(id, (s) => ({ ...s, error: data.message as string, state: 'error' }));
            break;
          case 'done':
            updateSession(id, (s) => ({ ...s, streamingText: '', toolCalls: [] }));
            // uiResources intentionally NOT cleared here — cards stay visible until next send
            break;
        }
      }

      try {
        const body: Record<string, unknown> = { content };
        if (attachments?.length) body.attachments = attachments;
        if (mentionedAgentId) body.mentionedAgentId = mentionedAgentId;

        const resp = await api.stream(`/chat/conversations/${id}/messages`, body, controller.signal);

        if (!resp.ok) {
          const errBody = await resp.json().catch(() => ({ error: 'Request failed' }));
          throw new Error((errBody as { error?: string }).error || `HTTP ${resp.status}`);
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
                const data = JSON.parse(json) as Record<string, unknown>;
                handleEvent(currentEvent, data);
              } catch {
                /* skip malformed */
              }
            }
          }
        }

        abortControllersRef.current.delete(id);
        updateSession(id, (s) => ({ ...s, state: 'idle', pendingUserMessage: null }));
        setActiveStreamingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        queryClient.invalidateQueries({ queryKey: [...MESSAGES_KEY, id] });
        queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      } catch (err: unknown) {
        if (controller.signal.aborted) {
          // Client-initiated abort — abort() already cleaned up state
          return;
        }
        const message = err instanceof Error ? err.message : 'Stream failed';
        abortControllersRef.current.delete(id);
        updateSession(id, (s) => ({ ...s, state: 'error', error: message, pendingUserMessage: null }));
        setActiveStreamingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [updateSession, queryClient],
  );

  const value = useMemo<ChatStreamContextValue>(
    () => ({ getSession, subscribe, start, abort, clearError, activeStreamingIds }),
    [getSession, subscribe, start, abort, clearError, activeStreamingIds],
  );

  return <ChatStreamCtx.Provider value={value}>{children}</ChatStreamCtx.Provider>;
}

/** Returns the chat stream context. Must be used within ChatStreamProvider. */
export function useChatStreamContext(): ChatStreamContextValue {
  const ctx = useContext(ChatStreamCtx);
  if (!ctx) throw new Error('useChatStreamContext must be used within ChatStreamProvider');
  return ctx;
}
