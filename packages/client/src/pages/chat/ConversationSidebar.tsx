import { Plus, Trash2, MessageSquare, Loader2, Terminal, Cloud, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { cn } from '@/lib/utils';
import type { ChatConversation, AgentProvider, ProviderModel, ChatBackendType, ExecutorStatus } from '@my-agents/shared';

interface ConversationSidebarProps {
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
}

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onDelete,
  backendType,
  onBackendTypeChange,
  providers,
  selectedProviderId,
  onProviderChange,
  selectedModel,
  onModelChange,
  models,
  modelsLoading,
  executors,
  selectedExecutorId,
  onExecutorChange,
}: ConversationSidebarProps) {
  const installedExecutors = executors.filter((e) => e.installed && e.authenticated);

  return (
    <div className="flex h-full flex-col border-r border-border bg-muted/30">
      <div className="border-b border-border p-3">
        <Button onClick={onNewChat} className="w-full" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No conversations yet
          </div>
        )}
        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={cn(
              'group flex cursor-pointer items-center gap-2 px-3 py-2.5 transition-colors hover:bg-muted/60',
              activeId === conv.id && 'bg-muted',
            )}
          >
            <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{conv.title || 'New Chat'}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(conv.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conv.id);
              }}
              className="p-1 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              aria-label="Delete conversation"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-border p-3 space-y-2">
        {/* Mode toggle -- only show if both options are available */}
        {providers.length > 0 && installedExecutors.length > 0 && (
          <div className="flex rounded-md border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => onBackendTypeChange('api')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium transition-colors',
                backendType === 'api'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Cloud className="h-3 w-3" />
              API
            </button>
            <button
              type="button"
              onClick={() => onBackendTypeChange('cli')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium transition-colors',
                backendType === 'cli'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Terminal className="h-3 w-3" />
              CLI
            </button>
          </div>
        )}

        {backendType === 'api' ? (
          <>
            <div className="space-y-1">
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Provider
              </label>
              <Select value={selectedProviderId} onValueChange={onProviderChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Model
                {modelsLoading && <Loader2 className="inline ml-1 h-3 w-3 animate-spin" />}
              </label>
              <Combobox
                options={models}
                value={selectedModel}
                onValueChange={onModelChange}
                placeholder={
                  !selectedProviderId
                    ? 'Select provider first'
                    : modelsLoading
                      ? 'Loading...'
                      : 'Select model'
                }
                searchPlaceholder="Search models..."
                emptyText="No models found."
                disabled={!selectedProviderId || modelsLoading}
                className="h-8 text-xs"
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1">
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                CLI Agent
              </label>
              <Select value={selectedExecutorId} onValueChange={onExecutorChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select CLI" />
                </SelectTrigger>
                <SelectContent>
                  {installedExecutors.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-1.5 items-start rounded-md bg-yellow-500/10 border border-yellow-500/20 px-2 py-1.5">
              <TriangleAlert className="h-3 w-3 shrink-0 text-yellow-500 mt-0.5" />
              <p className="text-[10px] text-yellow-200/80 leading-tight">
                CLI mode has no streaming -- responses arrive all at once. For the best experience, use API mode.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
