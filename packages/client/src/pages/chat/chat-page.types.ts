import type { ChatConversation, ChatMessage, AgentProvider, ProviderModel, ChatBackendType, ExecutorStatus } from '@atlas/shared';

export type ChatStreamState = 'idle' | 'streaming' | 'error';

export type StreamingToolCall = {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'done';
};

export type ThinkingStep = {
  id: string;
  toolName: string;
  hint?: string;
  status?: 'pending' | 'done';
};

export type AgentThinkingProps = {
  steps: ThinkingStep[];
  isStreaming: boolean;
};

export type MessageBubbleProps = {
  message: ChatMessage;
};

export type StreamingBubbleProps = {
  text: string;
  toolCalls: StreamingToolCall[];
};

export type ConversationSidebarProps = {
  conversations: ChatConversation[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  backendType: ChatBackendType;
  onBackendTypeChange: (type: ChatBackendType) => void;
  providers: AgentProvider[];
  selectedProviderId: string;
  onProviderChange: (id: string) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  models: ProviderModel[];
  modelsLoading: boolean;
  executors: ExecutorStatus[];
  selectedExecutorId: string;
  onExecutorChange: (id: string) => void;
};
