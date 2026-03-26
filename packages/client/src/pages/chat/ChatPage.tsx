import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Settings, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ChatBackendType } from '@atlas/shared';

import { Button } from '@/components/ui/button';
import { useActiveProject } from '@/contexts/ProjectContext';
import { useAgentProviders, useProviderModels } from '@/hooks/use-agent-providers.hook';
import { useAgentRuntimes } from '@/hooks/use-workspaces.hook';
import {
  useConversations,
  useConversation,
  useConversationMessages,
  useCreateConversation,
  useDeleteConversation,
  useChatStream,
} from '@/hooks/use-chat.hook';

import { ConversationSidebar } from './ConversationSidebar';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

export function ChatPage() {
  const { id: conversationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeProjectId } = useActiveProject();

  const { data: providers = [] } = useAgentProviders();
  const { data: executors = [] } = useAgentRuntimes();
  const { data: conversations = [] } = useConversations(activeProjectId);
  const { data: messages = [] } = useConversationMessages(conversationId);
  const { data: activeConversation } = useConversation(conversationId);
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const { state, streamingText, toolCalls, error, send, abort, pendingUserMessage } = useChatStream(conversationId);

  const [backendType, setBackendType] = useState<ChatBackendType>('api');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedExecutorId, setSelectedExecutorId] = useState('');
  const [creatingChat, setCreatingChat] = useState(false);
  const pendingMessageRef = useRef<string | null>(null);

  const { data: providerModels = [], isLoading: modelsLoading } = useProviderModels(
    backendType === 'api' ? (selectedProviderId || undefined) : undefined,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installedExecutors.length, selectedExecutorId]);

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
      const msg = pendingMessageRef.current;
      pendingMessageRef.current = null;
      setCreatingChat(false);
      send(msg);
    }
  }, [conversationId, state, send]);

  const handleProviderChange = useCallback((providerId: string) => {
    setSelectedProviderId(providerId);
    setSelectedModel('');
  }, []);

  const handleBackendTypeChange = useCallback((type: ChatBackendType) => {
    setBackendType(type);
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    navigate(`/chat/${id}`);
  }, [navigate]);

  const handleNewChat = useCallback(() => {
    setCreatingChat(false);
    pendingMessageRef.current = null;
    navigate('/chat');
  }, [navigate]);

  const handleDeleteConversation = useCallback(async (id: string) => {
    await deleteConversation.mutateAsync(id);
    if (id === conversationId) {
      navigate('/chat');
    }
  }, [deleteConversation, conversationId, navigate]);

  const handleSend = useCallback(async (content: string) => {
    if (conversationId) {
      send(content);
      return;
    }

    if (backendType === 'api') {
      if (!selectedProviderId || !selectedModel) return;
      setCreatingChat(true);
      pendingMessageRef.current = content;
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
      pendingMessageRef.current = content;
      const result = await createConversation.mutateAsync({
        projectId: activeProjectId ?? null,
        backendType: 'cli',
        executorId: selectedExecutorId,
        providerId: null,
        model: null,
      });
      navigate(`/chat/${result.id}`);
    }
  }, [conversationId, backendType, selectedProviderId, selectedModel, selectedExecutorId, activeProjectId, createConversation, navigate, send]);

  const hasAnyBackend = providers.length > 0 || installedExecutors.length > 0;

  if (!hasAnyBackend) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center p-8">
        <div className="rounded-full bg-muted p-4">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">No AI Backends Available</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          To use the chat, either configure an AI provider with an API key, or install a supported CLI agent (like Claude Code).
        </p>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link to="/settings?tab=providers">
              <Settings className="h-4 w-4 mr-2" />
              Configure API Provider
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/settings?tab=runtimes">
              <Terminal className="h-4 w-4 mr-2" />
              View CLI Agents
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const isNewChat = !conversationId;
  const canSend = isNewChat
    ? backendType === 'api'
      ? !!selectedProviderId && !!selectedModel
      : !!selectedExecutorId
    : true;

  return (
    <div className="flex flex-1 min-h-0 -m-6">
      <div className="w-[280px] shrink-0">
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
          <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center p-8">
            <div className="rounded-full bg-muted p-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold">New conversation</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Ask about your project, create tasks, set up agents, or manage rules -- all through natural conversation.
            </p>
          </div>
        ) : (
          <MessageList
            messages={messages}
            streamingText={streamingText}
            streamingToolCalls={toolCalls}
            isStreaming={state === 'streaming'}
            pendingUserMessage={pendingUserMessage}
          />
        )}
        {error && (
          <div className="px-4 py-2 text-sm text-destructive bg-destructive/10 border-t border-destructive/20">
            {error}
          </div>
        )}
        <ChatInput
          onSend={handleSend}
          disabled={!canSend || creatingChat || (state !== 'idle' && state !== 'error')}
          isStreaming={state === 'streaming' || creatingChat}
          onAbort={abort}
        />
      </div>
    </div>
  );
}
