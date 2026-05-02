// React / library
import { useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Settings, Terminal, Loader2, Unplug } from 'lucide-react';
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Components
import { EmptyState } from '@/components/empty-state/EmptyState';
import { ChatInput } from './components/ChatInput';
import { ConversationSidebar } from './components/ConversationSidebar';
import { MessageList } from './components/MessageList';

// Hooks
import { useConversations, useConversationMessages, useChatStream } from '@/hooks/use-chat.hook';
import { useChatConfig } from './hooks/use-chat-config.hook';
import { useChatActions } from './hooks/use-chat-actions.hook';

// Context
import { useActiveProject } from '@/contexts/ProjectContext';
import { TOUR_TARGETS } from '@/lib/tours/tour-targets';

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

  const config = useChatConfig(conversationId);
  const { data: conversations = [] } = useConversations(activeProjectId);
  const { data: messages = [] } = useConversationMessages(conversationId);
  const { state, streamingText, toolCalls, error, send, abort, clearError, pendingUserMessage } =
    useChatStream(conversationId);

  const { creatingChat, handleSend, handleNewChat, handleDeleteConversation, handleSelectConversation } =
    useChatActions({
      conversationId,
      activeProjectId,
      config,
      send,
      streamState: state,
    });

  // True when the server is still processing a response (e.g. user navigated away mid-stream and back)
  const isAwaitingResponse = state === 'idle' && messages.length > 0 && messages[messages.length - 1]?.role === 'user';
  const isNewChat = !conversationId;
  const hasAnyBackend = config.providers.length > 0 || config.installedExecutors.length > 0;

  if (config.providersLoading || config.executorsLoading) {
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

  return (
    <div className="flex flex-1 min-h-0 -m-6">
      <div data-tour={TOUR_TARGETS.chatSidebar} className="w-[280px] shrink-0">
        <ConversationSidebar
          conversations={conversations}
          activeId={conversationId}
          onSelect={handleSelectConversation}
          onNewChat={handleNewChat}
          onDelete={handleDeleteConversation}
          config={config}
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

        {config.isProviderDisconnected && (
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
            !config.canSend ||
            creatingChat ||
            isAwaitingResponse ||
            config.isProviderDisconnected ||
            (state !== 'idle' && state !== 'error')
          }
          isStreaming={state === 'streaming' || creatingChat || isAwaitingResponse}
          onAbort={abort}
          isNewChat={isNewChat}
          backendType={config.backendType}
          models={config.chatModels}
          selectedModel={config.selectedModel}
          onModelChange={config.onModelChange}
          executors={config.installedExecutors}
          selectedExecutorId={config.selectedExecutorId}
          onExecutorChange={config.onExecutorChange}
        />
      </div>
    </div>
  );
}
