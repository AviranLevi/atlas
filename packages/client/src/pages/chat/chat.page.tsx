// React / library
import { useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Settings, Terminal, Loader2, Unplug } from 'lucide-react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Components
import { EmptyState } from '@/components/empty-state/EmptyState';
import { ChatInput } from './components/ChatInput';
import { ConversationSidebar } from './components/ConversationSidebar';
import { MessageList } from './components/MessageList';

// Hooks
import { useAgentProviders, useProviderModels } from '@/hooks/use-agent-providers.hook';
import {
  useConversations,
  useConversation,
  useConversationMessages,
  useCreateConversation,
  useDeleteConversation,
  useChatStream,
} from '@/hooks/use-chat.hook';
import { useAgentRuntimes } from '@/hooks/use-workspaces.hook';

// Context
import { useActiveProject } from '@/contexts/ProjectContext';
import { TOUR_TARGETS } from '@/lib/tours/tour-targets';

// Types
import type { ChatAttachment, ChatBackendType } from '@atlas/shared';

export function ChatPage() {
  const { id: conversationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeProjectId } = useActiveProject();

  // Force a fresh fetch whenever the user lands on a conversation — defends
  // against a stale `[]` cache from a race where the messages query resolved
  // before the streaming POST persisted the user message server-side.
  useEffect(() => {
    if (conversationId) {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', conversationId] });
    }
  }, [conversationId, queryClient]);

  const { data: providers = [], isLoading: providersLoading } = useAgentProviders();
  const { data: executors = [], isLoading: executorsLoading } = useAgentRuntimes();
  const { data: conversations = [] } = useConversations(activeProjectId);
  const { data: messages = [] } = useConversationMessages(conversationId);
  const { data: activeConversation } = useConversation(conversationId);
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const { state, streamingText, toolCalls, error, send, abort, clearError, pendingUserMessage } =
    useChatStream(conversationId);
  // True when the server is still processing a response (e.g. user navigated away mid-stream and back)
  const isAwaitingResponse = state === 'idle' && messages.length > 0 && messages[messages.length - 1]?.role === 'user';

  const [backendType, setBackendType] = useState<ChatBackendType>('api');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedExecutorId, setSelectedExecutorId] = useState('');
  const [creatingChat, setCreatingChat] = useState(false);
  const pendingMessageRef = useRef<{
    content: string;
    attachments?: ChatAttachment[];
    mentionedAgentId?: string;
  } | null>(null);

  const { data: providerModels = [], isLoading: modelsLoading } = useProviderModels(
    backendType === 'api' ? selectedProviderId || undefined : undefined,
  );

  const installedExecutors = executors.filter((e) => e.installed && e.authenticated);

  // Auto-default backend type based on what's available
  useEffect(() => {
    if (providers.length > 0) {
      setBackendType('api');
    } else if (installedExecutors.length > 0) {
      setBackendType('cli');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers.length, installedExecutors.length]);

  // Auto-select first provider
  useEffect(() => {
    if (providers.length > 0 && !selectedProviderId) {
      setSelectedProviderId(providers[0].id);
    }
  }, [providers, selectedProviderId]);

  // Auto-select first model
  useEffect(() => {
    if (providerModels.length > 0 && !selectedModel) {
      setSelectedModel(providerModels[0].value);
    }
  }, [providerModels, selectedModel]);

  // Auto-select first executor
  useEffect(() => {
    if (installedExecutors.length > 0 && !selectedExecutorId) {
      setSelectedExecutorId(installedExecutors[0].id);
    }
  }, [installedExecutors, selectedExecutorId]);

  // Sync sidebar with active conversation
  useEffect(() => {
    if (activeConversation) {
      setBackendType(activeConversation.backendType as ChatBackendType);
      if (activeConversation.providerId) {
        setSelectedProviderId(activeConversation.providerId);
      }
      if (activeConversation.model) {
        setSelectedModel(activeConversation.model);
      }
      if (activeConversation.executorId) {
        setSelectedExecutorId(activeConversation.executorId);
      }
    }
  }, [activeConversation]);

  // Fire queued message after conversation creation + navigation
  useEffect(() => {
    if (conversationId && pendingMessageRef.current && state === 'idle') {
      const { content, attachments, mentionedAgentId } = pendingMessageRef.current;
      pendingMessageRef.current = null;
      setCreatingChat(false);
      send(content, attachments, mentionedAgentId);
    }
  }, [conversationId, state, send]);

  const handleProviderChange = useCallback((providerId: string) => {
    setSelectedProviderId(providerId);
    setSelectedModel('');
  }, []);

  const handleBackendTypeChange = useCallback((type: ChatBackendType) => {
    setBackendType(type);
  }, []);

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
      if (conversationId) {
        send(content, attachments, mentionedAgentId);
        return;
      }

      if (backendType === 'api') {
        if (!selectedProviderId || !selectedModel) return;
        setCreatingChat(true);
        pendingMessageRef.current = { content, attachments, mentionedAgentId };
        const result = await createConversation.mutateAsync({
          projectId: activeProjectId ?? null,
          backendType: 'api',
          providerId: selectedProviderId,
          model: selectedModel,
        });
        navigate(`/chat/${result.id}`);
      } else {
        if (!selectedExecutorId) return;
        setCreatingChat(true);
        pendingMessageRef.current = { content, attachments, mentionedAgentId };
        const result = await createConversation.mutateAsync({
          projectId: activeProjectId ?? null,
          backendType: 'cli',
          executorId: selectedExecutorId,
          providerId: null,
          model: null,
        });
        navigate(`/chat/${result.id}`);
      }
    },
    [
      conversationId,
      backendType,
      selectedProviderId,
      selectedModel,
      selectedExecutorId,
      activeProjectId,
      createConversation,
      navigate,
      send,
    ],
  );

  const hasAnyBackend = providers.length > 0 || installedExecutors.length > 0;

  if (providersLoading || executorsLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasAnyBackend) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <EmptyState
          icon={MessageSquare}
          title="No AI backends available"
          body="To use chat, either configure an AI provider with an API key, or install a supported CLI agent (like Claude Code)."
          primaryCta={{ label: 'Configure API Provider', asLink: { to: '/agents' }, icon: Settings }}
          secondaryCta={{ label: 'View CLI Agents', asLink: { to: '/agents' }, icon: Terminal }}
          className="border-0"
        />
      </div>
    );
  }

  const isNewChat = !conversationId;
  // Schema-level FK ON DELETE SET NULL on chat_conversations.provider_id: when
  // the user deletes the underlying provider, history survives but the
  // conversation can't continue until they pick a new provider/agent.
  const isProviderDisconnected =
    !!activeConversation && activeConversation.backendType === 'api' && activeConversation.providerId === null;
  const canSend = isNewChat
    ? backendType === 'api'
      ? !!selectedProviderId && !!selectedModel
      : !!selectedExecutorId
    : !isProviderDisconnected;

  return (
    <div className="flex flex-1 min-h-0 -m-6">
      <div data-tour={TOUR_TARGETS.chatSidebar} className="w-[280px] shrink-0">
        <ConversationSidebar
          conversations={conversations}
          activeId={conversationId}
          onSelect={handleSelectConversation}
          onNewChat={handleNewChat}
          onDelete={handleDeleteConversation}
          backendType={backendType}
          onBackendTypeChange={handleBackendTypeChange}
          providers={providers}
          selectedProviderId={selectedProviderId}
          onProviderChange={handleProviderChange}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          models={providerModels}
          modelsLoading={modelsLoading}
          executors={executors}
          selectedExecutorId={selectedExecutorId}
          onExecutorChange={setSelectedExecutorId}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {isNewChat && !creatingChat ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <EmptyState
              icon={MessageSquare}
              title="New conversation"
              body="Ask about your project, create tasks, set up agents, or manage rules — all through natural conversation."
              className="border-0"
            />
          </div>
        ) : (
          <MessageList
            messages={messages}
            streamingText={streamingText}
            streamingToolCalls={toolCalls}
            isStreaming={state === 'streaming' || isAwaitingResponse}
            pendingUserMessage={pendingUserMessage}
          />
        )}
        {error && (
          <div className="flex items-center gap-3 px-4 py-2 text-sm text-destructive bg-destructive/10 border-t border-destructive/20">
            <span className="flex-1">{error}</span>
            <button
              type="button"
              className="text-xs underline underline-offset-2 hover:no-underline shrink-0"
              onClick={clearError}
            >
              Dismiss
            </button>
          </div>
        )}
        {isProviderDisconnected && (
          <div className="flex items-center gap-3 px-4 py-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-500/10 border-t border-amber-500/20">
            <Unplug className="h-4 w-4 shrink-0" />
            <span className="flex-1">
              This conversation&rsquo;s AI provider was removed. Start a new chat or reconnect a provider.
            </span>
          </div>
        )}
        <ChatInput
          onSend={handleSend}
          disabled={
            !canSend ||
            creatingChat ||
            isAwaitingResponse ||
            isProviderDisconnected ||
            (state !== 'idle' && state !== 'error')
          }
          isStreaming={state === 'streaming' || creatingChat || isAwaitingResponse}
          onAbort={abort}
          isNewChat={isNewChat}
          backendType={backendType}
          models={providerModels}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          executors={installedExecutors}
          selectedExecutorId={selectedExecutorId}
          onExecutorChange={setSelectedExecutorId}
        />
      </div>
    </div>
  );
}
