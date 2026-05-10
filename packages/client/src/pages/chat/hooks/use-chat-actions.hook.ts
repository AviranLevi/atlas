// React / library
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Hooks
import { useCreateConversation, useDeleteConversation } from '@/hooks/use-chat.hook';

// Types
import type { ChatAttachment } from '@atlas/shared';
import type { ChatConfigState, ChatStreamState } from '../chat.types';

type ChatActionsParams = {
  conversationId: string | undefined;
  activeProjectId: string | null | undefined;
  config: Pick<
    ChatConfigState,
    'backendType' | 'selectedProviderId' | 'selectedModel' | 'selectedExecutorId' | 'selectedAgentId' | 'executionMode'
  >;
  send: (content: string, attachments?: ChatAttachment[], mentionedAgentId?: string) => void;
  streamState: ChatStreamState;
};

/** Manages conversation lifecycle: create, delete, navigate, and queue-then-send on first message. */
export function useChatActions({ conversationId, activeProjectId, config, send, streamState }: ChatActionsParams) {
  const navigate = useNavigate();
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const [creatingChat, setCreatingChat] = useState(false);
  const pendingMessageRef = useRef<{
    content: string;
    attachments?: ChatAttachment[];
    mentionedAgentId?: string;
  } | null>(null);

  // Fire the queued first message after conversation creation + navigation settle
  useEffect(() => {
    if (conversationId && pendingMessageRef.current && streamState === 'idle') {
      const { content, attachments, mentionedAgentId } = pendingMessageRef.current;
      pendingMessageRef.current = null;
      setCreatingChat(false);
      send(content, attachments, mentionedAgentId);
    }
  }, [conversationId, streamState, send]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      navigate(`/chat/${id}`);
    },
    [navigate],
  );

  const handleNewChat = useCallback(() => {
    setCreatingChat(false);
    pendingMessageRef.current = null;
    navigate('/chat');
  }, [navigate]);

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      await deleteConversation.mutateAsync(id);
      if (id === conversationId) {
        navigate('/chat');
      }
    },
    [deleteConversation, conversationId, navigate],
  );

  const handleSend = useCallback(
    async (content: string, attachments?: ChatAttachment[], mentionedAgentId?: string) => {
      // @mention overrides the persistent agent picker; picker is the fallback
      const effectiveAgentId = mentionedAgentId || config.selectedAgentId || undefined;

      if (conversationId) {
        send(content, attachments, effectiveAgentId);
        return;
      }

      const { backendType, selectedProviderId, selectedModel, selectedExecutorId, executionMode } = config;

      if (backendType === 'api') {
        if (!selectedProviderId || !selectedModel) return;
        setCreatingChat(true);
        pendingMessageRef.current = { content, attachments, mentionedAgentId: effectiveAgentId };
        const result = await createConversation.mutateAsync({
          projectId: activeProjectId ?? null,
          backendType: 'api',
          providerId: selectedProviderId,
          model: selectedModel,
          executionMode: executionMode ?? null,
        });
        navigate(`/chat/${result.id}`);
      } else {
        if (!selectedExecutorId) return;
        setCreatingChat(true);
        pendingMessageRef.current = { content, attachments, mentionedAgentId: effectiveAgentId };
        const result = await createConversation.mutateAsync({
          projectId: activeProjectId ?? null,
          backendType: 'cli',
          executorId: selectedExecutorId,
          providerId: null,
          model: selectedModel || null,
          executionMode: executionMode ?? null,
        });
        navigate(`/chat/${result.id}`);
      }
    },
    [conversationId, config, activeProjectId, createConversation, navigate, send],
  );

  return {
    creatingChat,
    handleSend,
    handleNewChat,
    handleDeleteConversation,
    handleSelectConversation,
  };
}
