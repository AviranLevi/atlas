// Types
import type {
  Agent,
  AgentProvider,
  ChatBackendType,
  ExecutionMode,
  ExecutorStatus,
  ProviderModel,
} from '@atlas/shared';

export type ChatInputActionBarProps = {
  isNewChat?: boolean;
  backendType?: ChatBackendType;
  showBackendToggle?: boolean;
  onBackendTypeChange?: (type: ChatBackendType) => void;
  providers?: AgentProvider[];
  selectedProviderId?: string;
  onProviderChange?: (id: string) => void;
  models?: ProviderModel[];
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  executors?: ExecutorStatus[];
  selectedExecutorId?: string;
  onExecutorChange?: (id: string) => void;
  agents?: Agent[];
  selectedAgentId?: string;
  onAgentChange?: (id: string) => void;
  executionMode?: ExecutionMode;
  onExecutionModeChange?: (mode: ExecutionMode) => void;
  disabled?: boolean;
  canSend: boolean;
  isStreaming?: boolean;
  onSend: () => void;
  onAbort?: () => void;
  onAttachClick: () => void;
  attachCount: number;
};

export type ChatModeSelectProps = {
  executionMode: ExecutionMode;
  onExecutionModeChange: (mode: ExecutionMode) => void;
};

export type ChatBackendSelectProps = {
  isNewChat?: boolean;
  backendType?: ChatBackendType;
  showBackendToggle?: boolean;
  onBackendTypeChange?: (type: ChatBackendType) => void;
  providers?: AgentProvider[];
  selectedProviderId?: string;
  onProviderChange?: (id: string) => void;
  models?: ProviderModel[];
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  executors?: ExecutorStatus[];
  selectedExecutorId?: string;
  onExecutorChange?: (id: string) => void;
};

export type ChatAgentSelectProps = {
  agents: Agent[];
  selectedAgentId?: string;
  onAgentChange: (id: string) => void;
};
