// Types
import type {
  ChatAttachment,
  ChatConversation,
  ChatMessage,
  AgentProvider,
  ProviderModel,
  ChatBackendType,
  ExecutorStatus,
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
