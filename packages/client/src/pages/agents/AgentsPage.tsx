// React / library
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Components
import { AgentDialog } from '@/components/agents/AgentDialog';
import { AgentProviderDialog } from '@/components/agents/AgentProviderDialog';
import { ImportPackageDialog } from '@/components/packages/ImportPackageDialog';
import { AgentsSection } from './AgentsSection';
import { ProvidersSection } from './ProvidersSection';

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
    if (confirm('Delete this agent?')) {
      deleteAgent.mutate(id);
    }
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
    if (confirm('Delete this provider?')) {
      deleteProvider.mutate(id);
    }
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
    </div>
  );
}
