// Types
import type {
  Agent,
  AgentProvider,
  ChatAttachment,
  ChatBackendType,
  ChatConversation,
  ChatMessage,
  ExecutorStatus,
  ProviderModel,
} from '@atlas/shared';

export type ChatStreamState = 'idle' | 'streaming' | 'error';

/** A file staged in the UI before it is sent (holds the raw File object and an optional preview URL). */
export type AttachedFile = {
  /** Unique client-side key for React rendering. */
  id: string;
  file: File;
  /** Object URL for image previews — set via URL.createObjectURL, must be revoked on removal. */
  previewUrl?: string;
  mimeType: string;
  name: string;
  size: number;
};

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

export type ChatInputProps = {
  onSend: (content: string, attachments?: ChatAttachment[], mentionedAgentId?: string) => void;
  disabled?: boolean;
  isStreaming?: boolean;
  onAbort?: () => void;
  /** Whether this is a new (unsaved) conversation — controls whether model picker is interactive. */
  isNewChat?: boolean;
  backendType?: ChatBackendType;
  /** API mode: available models for the selected provider. */
  models?: ProviderModel[];
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  /** CLI mode: available installed executors. */
  executors?: ExecutorStatus[];
  selectedExecutorId?: string;
  onExecutorChange?: (id: string) => void;
};

export type MessageBubbleProps = {
  message: ChatMessage;
};

export type StreamingBubbleProps = {
  text: string;
  toolCalls: StreamingToolCall[];
};

/** All backend/provider/model/executor/agent config managed by `useChatConfig`. */
export type ChatConfigState = {
  providers: AgentProvider[];
  models: ProviderModel[];
  modelsLoading: boolean;
  executors: ExecutorStatus[];
  installedExecutors: ExecutorStatus[];
  chatModels: ProviderModel[];
  backendType: ChatBackendType;
  selectedProviderId: string;
  selectedModel: string;
  selectedExecutorId: string;
  /** Persistent agent selection — applies to all messages unless overridden by an @mention. */
  agents: Agent[];
  selectedAgentId: string;
  onAgentChange: (id: string) => void;
  onBackendTypeChange: (type: ChatBackendType) => void;
  onProviderChange: (id: string) => void;
  onModelChange: (model: string) => void;
  onExecutorChange: (id: string) => void;
  canSend: boolean;
  isProviderDisconnected: boolean;
  providersLoading: boolean;
  executorsLoading: boolean;
};

export type ConversationSidebarProps = {
  conversations: ChatConversation[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  config: ChatConfigState;
};
