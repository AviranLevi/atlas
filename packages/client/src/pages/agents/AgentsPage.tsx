import { useState } from 'react';
import type { Agent, AgentProvider } from '@my-agents/shared';
import { Bot, Plus, Pencil, Trash2, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAgents, useDeleteAgent } from '@/hooks/use-agents.hook';
import { useAgentProviders, useDeleteAgentProvider } from '@/hooks/use-agent-providers.hook';
import { AgentDialog } from '@/components/agents/AgentDialog';
import { AgentProviderDialog, ProviderTypeBadge } from '@/components/agents/AgentProviderDialog';

export function AgentsPage() {
  const { data: agents, isLoading } = useAgents();
  const deleteAgent = useDeleteAgent();
  const { data: providers = [], isLoading: providersLoading } = useAgentProviders();
  const deleteProvider = useDeleteAgentProvider();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | undefined>();
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AgentProvider | undefined>();

  const handleCreate = () => {
    setEditingAgent(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
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
      {/* Providers Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <Cpu className="h-5 w-5 text-muted-foreground" />
              AI Providers
            </h2>
            <p className="text-muted-foreground mt-0.5 text-sm">API keys and model configurations</p>
          </div>
          <Button onClick={handleCreateProvider} size="sm" variant="outline">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Provider
          </Button>
        </div>
        {providersLoading ? (
          <div className="text-muted-foreground py-6 text-center text-sm">Loading...</div>
        ) : providers.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <Cpu className="text-muted-foreground mx-auto mb-3 h-8 w-8" />
            <p className="text-muted-foreground text-sm">No providers configured. Add one to link agents to real AI models.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => (
              <Card key={provider.id} className="group relative flex flex-col gap-1 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">{provider.name}</span>
                      <ProviderTypeBadge type={provider.type} />
                    </div>
                    {provider.modelName && (
                      <p className="text-muted-foreground text-xs truncate">{provider.modelName}</p>
                    )}
                    {provider.baseUrl && (
                      <p className="text-muted-foreground text-xs truncate">{provider.baseUrl}</p>
                    )}
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditProvider(provider)} aria-label="Edit provider">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteProvider(provider.id)} aria-label="Delete provider">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Agents Section */}
      <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Manage your AI agent configurations</p>
        </div>
        <Button onClick={handleCreate} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          New Agent
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground py-12 text-center text-sm">Loading...</div>
      ) : !agents?.length ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Bot className="text-muted-foreground mx-auto mb-4 h-10 w-10" />
          <h3 className="mb-1 text-base font-medium">No agents yet</h3>
          <p className="text-muted-foreground mb-4 text-sm">Create your first AI agent to get started.</p>
          <Button onClick={handleCreate} variant="outline" size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Create Agent
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {agents.map((agent) => (
            <Card
              key={agent.id}
              className="group relative flex flex-col gap-1.5 p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                  <Bot className="text-primary h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold">{agent.name}</h3>
                  {agent.description && (
                    <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-relaxed">
                      {agent.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="absolute right-2 top-2 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleEdit(agent)}
                  aria-label="Edit agent"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleDelete(agent.id)}
                  aria-label="Delete agent"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AgentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        agent={editingAgent}
      />
      </div>

      <AgentProviderDialog
        open={providerDialogOpen}
        onOpenChange={setProviderDialogOpen}
        provider={editingProvider}
      />
    </div>
  );
}
