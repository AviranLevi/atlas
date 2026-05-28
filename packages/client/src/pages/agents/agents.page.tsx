// React / library
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Components
import { AgentDialog } from '@/components/agents/AgentDialog';
import { AgentProviderDialog } from '@/components/agents/AgentProviderDialog';
import { ImportPackageDialog } from '@/components/packages/ImportPackageDialog';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { AgentsSection } from './components/AgentsSection';
import { ProvidersSection } from './components/ProvidersSection';

// Hooks
import { useAgentProviders, useDeleteAgentProvider } from '@/hooks/use-agent-providers.hook';
import { useAgents, useDeleteAgent } from '@/hooks/use-agents.hook';

// Types
import type { Agent, AgentProvider } from '@atlas/shared';

export function AgentsPage() {
  const navigate = useNavigate();
  const { data: agents, isLoading } = useAgents();
  const deleteAgent = useDeleteAgent();
  const { data: providers = [], isLoading: providersLoading } = useAgentProviders();
  const deleteProvider = useDeleteAgentProvider();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | undefined>();
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AgentProvider | undefined>();
  const [importOpen, setImportOpen] = useState(false);
  const [deleteAgentId, setDeleteAgentId] = useState<string | null>(null);
  const [deleteProviderId, setDeleteProviderId] = useState<string | null>(null);

  const handleCreateAgent = () => {
    setEditingAgent(undefined);
    setDialogOpen(true);
  };

  const handleEditAgent = (e: React.MouseEvent, agent: Agent) => {
    e.stopPropagation();
    setEditingAgent(agent);
    setDialogOpen(true);
  };

  const handleDeleteAgent = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteAgentId(id);
  };

  const handleCreateProvider = () => {
    setEditingProvider(undefined);
    setProviderDialogOpen(true);
  };

  const handleEditProvider = (provider: AgentProvider) => {
    setEditingProvider(provider);
    setProviderDialogOpen(true);
  };

  const handleDeleteProvider = (id: string) => {
    setDeleteProviderId(id);
  };

  return (
    <div className="flex flex-col gap-10">
      <ProvidersSection
        providers={providers}
        isLoading={providersLoading}
        onCreate={handleCreateProvider}
        onEdit={handleEditProvider}
        onDelete={handleDeleteProvider}
      />

      <AgentsSection
        agents={agents}
        isLoading={isLoading}
        onCreate={handleCreateAgent}
        onImport={() => setImportOpen(true)}
        onEdit={handleEditAgent}
        onDelete={handleDeleteAgent}
        onNavigate={(id) => navigate(`/agents/${id}`)}
      />

      <AgentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        agent={editingAgent}
        onCreated={(agent) => navigate(`/agents/${agent.id}`)}
      />

      <AgentProviderDialog open={providerDialogOpen} onOpenChange={setProviderDialogOpen} provider={editingProvider} />

      <ImportPackageDialog open={importOpen} onOpenChange={setImportOpen} />

      <ConfirmDeleteDialog
        open={!!deleteAgentId}
        onOpenChange={(open) => !open && setDeleteAgentId(null)}
        title="Delete agent"
        description={`This will permanently delete "${agents?.find((a) => a.id === deleteAgentId)?.name ?? 'this agent'}". This action cannot be undone.`}
        isPending={deleteAgent.isPending}
        onConfirm={() => {
          if (deleteAgentId) {
            deleteAgent.mutate(deleteAgentId, { onSuccess: () => setDeleteAgentId(null) });
          }
        }}
      />

      <ConfirmDeleteDialog
        open={!!deleteProviderId}
        onOpenChange={(open) => !open && setDeleteProviderId(null)}
        title="Delete provider"
        description="This will permanently delete the provider. This action cannot be undone."
        isPending={deleteProvider.isPending}
        onConfirm={() => {
          if (deleteProviderId) {
            deleteProvider.mutate(deleteProviderId, { onSuccess: () => setDeleteProviderId(null) });
          }
        }}
      />
    </div>
  );
}
