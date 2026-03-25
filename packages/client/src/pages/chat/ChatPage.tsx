import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useActiveProject } from '@/contexts/ProjectContext';
import { useAgentProviders, useProviderModels } from '@/hooks/use-agent-providers.hook';
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
  const { data: conversations = [] } = useConversations(activeProjectId);
  const { data: messages = [] } = useConversationMessages(conversationId);
  const { data: activeConversation } = useConversation(conversationId);
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const { state, streamingText, toolCalls, error, send, abort, pendingUserMessage } = useChatStream(conversationId);

  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [creatingChat, setCreatingChat] = useState(false);
  const pendingMessageRef = useRef<string | null>(null);

  const { data: providerModels = [], isLoading: modelsLoading } = useProviderModels(
    selectedProviderId || undefined,
  );

  useEffect(() => {
    if (providers.length > 0 && !selectedProviderId) {
      setSelectedProviderId(providers[0].id);
    }
  }, [providers, selectedProviderId]);

  useEffect(() => {
    if (providerModels.length > 0 && !selectedModel) {
      setSelectedModel(providerModels[0].value);
    }
  }, [providerModels, selectedModel]);

  useEffect(() => {
    if (activeConversation) {
      setSelectedProviderId(activeConversation.providerId);
      setSelectedModel(activeConversation.model);
    }
  }, [activeConversation]);

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

    if (!selectedProviderId || !selectedModel) return;

    setCreatingChat(true);
    pendingMessageRef.current = content;
    const result = await createConversation.mutateAsync({
      projectId: activeProjectId ?? null,
      providerId: selectedProviderId,
      model: selectedModel,
    });
    navigate(`/chat/${result.id}`);
  }, [conversationId, selectedProviderId, selectedModel, activeProjectId, createConversation, navigate, send]);

  if (providers.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center p-8">
        <div className="rounded-full bg-muted p-4">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">No AI Providers Configured</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          To use the chat, you need to configure at least one AI provider (Anthropic, OpenAI, Google, or Ollama) with an API key.
        </p>
        <Button asChild>
          <Link to="/settings?tab=providers">
            <Settings className="h-4 w-4 mr-2" />
            Configure Providers
          </Link>
        </Button>
      </div>
    );
  }

  const isNewChat = !conversationId;
  const canSend = isNewChat
    ? !!selectedProviderId && !!selectedModel
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
          providers={providers}
          selectedProviderId={selectedProviderId}
          onProviderChange={handleProviderChange}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          models={providerModels}
          modelsLoading={modelsLoading}
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
