// React / library
import { useCallback, useEffect, useState } from 'react';

// Hooks
import { useAgents } from '@/hooks/use-agents.hook';
import { useAgentProviders, useProviderModels } from '@/hooks/use-agent-providers.hook';
import { useConversation, useUpdateConversationConfig, useUpdateConversationMode } from '@/hooks/use-chat.hook';
import { useAgentRuntimes } from '@/hooks/use-workspaces.hook';

// Lib
import {
  getChatPrefs,
  rememberBackendType,
  rememberExecutor,
  rememberModelForExecutor,
  rememberModelForProvider,
  rememberProvider,
} from '@/lib/chat-prefs';

// Types
import type { ChatBackendType, ExecutionMode } from '@atlas/shared';
import type { ChatConfigState } from '../chat.types';

/** Manages backend/provider/model/executor selection state and all auto-defaulting effects. */
export function useChatConfig(conversationId: string | undefined): ChatConfigState {
  const { data: providers = [], isLoading: providersLoading } = useAgentProviders();
  const { data: executors = [], isLoading: executorsLoading } = useAgentRuntimes();
  const { data: activeConversation } = useConversation(conversationId);
  const updateMode = useUpdateConversationMode();
  const updateConfig = useUpdateConversationConfig();

  // Seed initial state from remembered preferences so new chats start with last-used config.
  const initialPrefs = getChatPrefs();
  const [backendType, setBackendType] = useState<ChatBackendType>(initialPrefs.lastBackendType ?? 'api');
  const [selectedProviderId, setSelectedProviderId] = useState(initialPrefs.lastProviderId ?? '');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedExecutorId, setSelectedExecutorId] = useState(initialPrefs.lastExecutorId ?? '');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('confirm');

  const { data: agents = [] } = useAgents();

  const { data: providerModels = [], isLoading: modelsLoading } = useProviderModels(
    backendType === 'api' ? selectedProviderId || undefined : undefined,
  );

  const installedExecutors = executors.filter((e) => e.installed && e.authenticated);
  const selectedExecutorConfig = installedExecutors.find((e) => e.id === selectedExecutorId);
  const chatModels = backendType === 'api' ? providerModels : (selectedExecutorConfig?.modelPresets ?? []);

  // Auto-default backend type based on what's available — prefer remembered choice if still valid.
  useEffect(() => {
    if (providers.length > 0 && installedExecutors.length === 0) {
      setBackendType('api');
    } else if (installedExecutors.length > 0 && providers.length === 0) {
      setBackendType('cli');
    }
    // When both are available, keep the remembered choice (already set in useState initializer).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers.length, installedExecutors.length]);

  // Auto-select provider: prefer remembered if still in the list, else first available.
  useEffect(() => {
    if (providers.length === 0 || selectedProviderId) return;
    const prefs = getChatPrefs();
    const preferred = prefs.lastProviderId && providers.find((p) => p.id === prefs.lastProviderId);
    setSelectedProviderId(preferred ? preferred.id : providers[0].id);
  }, [providers, selectedProviderId]);

  // Auto-select API model: prefer remembered → provider's configured model → first available.
  useEffect(() => {
    if (providerModels.length === 0 || selectedModel) return;
    const remembered = getChatPrefs().modelByProvider(selectedProviderId);
    const match = remembered && providerModels.find((m) => m.value === remembered);
    if (match) {
      setSelectedModel(match.value);
      return;
    }
    // Fall back to the model configured on the provider itself (e.g. gpt-5.5-pro).
    const selectedProvider = providers.find((p) => p.id === selectedProviderId);
    if (selectedProvider) {
      const providerDefault = providerModels.find((m) => m.value === selectedProvider.modelName);
      if (providerDefault) {
        setSelectedModel(providerDefault.value);
        return;
      }
    }
    setSelectedModel(providerModels[0].value);
  }, [providerModels, selectedModel, selectedProviderId, providers]);

  // Auto-select executor: prefer remembered if still in the list, else first available.
  useEffect(() => {
    if (installedExecutors.length === 0 || selectedExecutorId) return;
    const prefs = getChatPrefs();
    const preferred = prefs.lastExecutorId && installedExecutors.find((e) => e.id === prefs.lastExecutorId);
    setSelectedExecutorId(preferred ? preferred.id : installedExecutors[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installedExecutors.length, selectedExecutorId]);

  // Auto-select CLI model when executor changes: prefer remembered, else first preset.
  useEffect(() => {
    if (backendType !== 'cli') return;
    const presets = executors.find((e) => e.id === selectedExecutorId)?.modelPresets ?? [];
    if (presets.length === 0 || selectedModel) return;
    const remembered = getChatPrefs().modelByExecutor(selectedExecutorId);
    const match = remembered && presets.find((m) => m.value === remembered);
    setSelectedModel(match ? match.value : presets[0].value);
  }, [backendType, selectedExecutorId, executors, selectedModel]);

  // Sync local state when navigating to an existing conversation.
  // Uses raw setters intentionally — these are server-driven values, not user-initiated
  // changes, so they must NOT trigger mutation calls or overwrite preferences.
  useEffect(() => {
    if (activeConversation) {
      setBackendType(activeConversation.backendType as ChatBackendType);
      if (activeConversation.providerId) setSelectedProviderId(activeConversation.providerId);
      if (activeConversation.model) setSelectedModel(activeConversation.model);
      if (activeConversation.executorId) setSelectedExecutorId(activeConversation.executorId);
      if (activeConversation.executionMode) {
        setExecutionMode(activeConversation.executionMode as ExecutionMode);
      } else {
        setExecutionMode('confirm');
      }
    }
  }, [activeConversation]);

  // --- User-initiated handlers: update local state, save prefs, and PATCH server if in a conversation ---

  const onProviderChange = useCallback(
    (id: string) => {
      setSelectedProviderId(id);
      setSelectedModel('');
      rememberProvider(id);
      if (conversationId) updateConfig.mutate({ id: conversationId, data: { providerId: id, model: null } });
    },
    [conversationId, updateConfig],
  );

  const onExecutorChange = useCallback(
    (id: string) => {
      setSelectedExecutorId(id);
      setSelectedModel('');
      rememberExecutor(id);
      if (conversationId) updateConfig.mutate({ id: conversationId, data: { executorId: id, model: null } });
    },
    [conversationId, updateConfig],
  );

  const onModelChange = useCallback(
    (model: string) => {
      setSelectedModel(model);
      if (backendType === 'api' && selectedProviderId) rememberModelForProvider(selectedProviderId, model);
      if (backendType === 'cli' && selectedExecutorId) rememberModelForExecutor(selectedExecutorId, model);
      if (conversationId) updateConfig.mutate({ id: conversationId, data: { model } });
    },
    [conversationId, backendType, selectedProviderId, selectedExecutorId, updateConfig],
  );

  const onAgentChange = useCallback((id: string) => {
    setSelectedAgentId(id);
  }, []);

  const onExecutionModeChange = useCallback(
    (mode: ExecutionMode) => {
      setExecutionMode(mode);
      if (conversationId) {
        updateMode.mutate({ id: conversationId, executionMode: mode });
      }
    },
    [conversationId, updateMode],
  );

  const onBackendTypeChange = useCallback((type: ChatBackendType) => {
    setBackendType(type);
    setSelectedModel('');
    rememberBackendType(type);
    // No server push — backend type is immutable after conversation creation; this only applies to new chats.
  }, []);

  const isNewChat = !conversationId;
  const isProviderDisconnected =
    !!activeConversation && activeConversation.backendType === 'api' && activeConversation.providerId === null;

  const canSend = isNewChat
    ? backendType === 'api'
      ? !!selectedProviderId && !!selectedModel
      : !!selectedExecutorId && (chatModels.length === 0 || !!selectedModel)
    : !isProviderDisconnected;

  return {
    providers,
    models: providerModels,
    modelsLoading,
    executors,
    installedExecutors,
    chatModels,
    backendType,
    selectedProviderId,
    selectedModel,
    selectedExecutorId,
    agents,
    selectedAgentId,
    executionMode,
    onAgentChange,
    onExecutionModeChange,
    onBackendTypeChange,
    onProviderChange,
    onModelChange,
    onExecutorChange,
    canSend,
    isProviderDisconnected,
    providersLoading,
    executorsLoading,
  };
}
