// React / library
import { useCallback, useEffect, useState } from 'react';

// Hooks
import { useAgentProviders, useProviderModels } from '@/hooks/use-agent-providers.hook';
import { useConversation } from '@/hooks/use-chat.hook';
import { useAgentRuntimes } from '@/hooks/use-workspaces.hook';

// Types
import type { ChatBackendType } from '@atlas/shared';
import type { ChatConfigState } from '../chat.types';

/** Manages backend/provider/model/executor selection state and all auto-defaulting effects. */
export function useChatConfig(conversationId: string | undefined): ChatConfigState {
  const { data: providers = [], isLoading: providersLoading } = useAgentProviders();
  const { data: executors = [], isLoading: executorsLoading } = useAgentRuntimes();
  const { data: activeConversation } = useConversation(conversationId);

  const [backendType, setBackendType] = useState<ChatBackendType>('api');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedExecutorId, setSelectedExecutorId] = useState('');

  const { data: providerModels = [], isLoading: modelsLoading } = useProviderModels(
    backendType === 'api' ? selectedProviderId || undefined : undefined,
  );

  const installedExecutors = executors.filter((e) => e.installed && e.authenticated);
  const selectedExecutorConfig = installedExecutors.find((e) => e.id === selectedExecutorId);
  const chatModels = backendType === 'api' ? providerModels : (selectedExecutorConfig?.modelPresets ?? []);

  // Auto-default backend type based on what's available
  useEffect(() => {
    if (providers.length > 0) {
      setBackendType('api');
    } else if (installedExecutors.length > 0) {
      setBackendType('cli');
    }
    // installedExecutors is derived from executors — referencing lengths avoids array identity churn
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers.length, installedExecutors.length]);

  // Auto-select first provider
  useEffect(() => {
    if (providers.length > 0 && !selectedProviderId) {
      setSelectedProviderId(providers[0].id);
    }
  }, [providers, selectedProviderId]);

  // Auto-select first API model
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

  // Auto-select first CLI model when executor changes
  useEffect(() => {
    if (backendType !== 'cli') return;
    const presets = executors.find((e) => e.id === selectedExecutorId)?.modelPresets ?? [];
    if (presets.length > 0 && !selectedModel) {
      setSelectedModel(presets[0].value);
    }
  }, [backendType, selectedExecutorId, executors, selectedModel]);

  // Sync selection when navigating to an existing conversation
  useEffect(() => {
    if (activeConversation) {
      setBackendType(activeConversation.backendType as ChatBackendType);
      if (activeConversation.providerId) setSelectedProviderId(activeConversation.providerId);
      if (activeConversation.model) setSelectedModel(activeConversation.model);
      if (activeConversation.executorId) setSelectedExecutorId(activeConversation.executorId);
    }
  }, [activeConversation]);

  const onProviderChange = useCallback((providerId: string) => {
    setSelectedProviderId(providerId);
    setSelectedModel('');
  }, []);

  const onExecutorChange = useCallback((id: string) => {
    setSelectedExecutorId(id);
    setSelectedModel('');
  }, []);

  const onBackendTypeChange = useCallback((type: ChatBackendType) => {
    setBackendType(type);
    setSelectedModel('');
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
    onBackendTypeChange,
    onProviderChange,
    onModelChange: setSelectedModel,
    onExecutorChange,
    canSend,
    isProviderDisconnected,
    providersLoading,
    executorsLoading,
  };
}
