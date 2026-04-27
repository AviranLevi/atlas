// React / library
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Components
import { AgentDialog } from '@/components/agents/AgentDialog';
import { AgentProviderDialog } from '@/components/agents/AgentProviderDialog';
import { ImportPackageDialog } from '@/components/packages/ImportPackageDialog';
import { AgentsSection } from './components/AgentsSection';
import { ProvidersSection } from './components/ProvidersSection';

// Hooks
import { useAgentProviders, useDeleteAgentProvider } from '@/hooks/use-agent-providers.hook';
import { useAgents, useDeleteAgent } from '@/hooks/use-agents.hook';

// Lib
import { ApiError } from '@/lib/api';

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
    const agent = agents?.find((a) => a.id === id);
    const name = agent?.name ?? 'this agent';
    if (!confirm(`Delete agent "${name}"?`)) return;
    deleteAgent.mutate(id, {
      onError: (err) => {
        // 409 from RESTRICT pre-check: server returns structured details so we
        // can render a precise toast instead of a generic FK error string.
        if (err instanceof ApiError && err.status === 409 && err.details) {
          const { agentName, taskCount } = err.details as { agentName?: string; taskCount?: number };
          toast.error(
            `Cannot delete "${agentName ?? name}" — ${taskCount ?? '?'} active task(s) still assigned. Reassign first.`,
          );
          return;
        }
        toast.error((err as Error).message);
      },
    });
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
