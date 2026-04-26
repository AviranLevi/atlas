// React / library
import { Plus, Trash2, MessageSquare, Loader2, Terminal, Cloud, Search, X } from 'lucide-react';
import { useState } from 'react';

// Components
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Lib
import { cn } from '@/lib/utils';
import { TOUR_TARGETS } from '@/lib/tours/tour-targets';

// Types
import type { ConversationSidebarProps } from '../chat.types';

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
  const [searchQuery, setSearchQuery] = useState('');
  const installedExecutors = executors.filter((e) => e.installed && e.authenticated);

  const filteredConversations = searchQuery.trim()
    ? conversations.filter((c) => (c.title || 'New Chat').toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;

  return (
    <div className="flex h-full flex-col border-r border-border bg-muted/30">
      <div className="border-b border-border p-3 space-y-2">
        <Button onClick={onNewChat} className="w-full" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>

        {conversations.length > 0 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="h-8 pl-8 pr-7 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-6 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">Start a new chat to begin.</p>
            </div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No conversations match &ldquo;{searchQuery}&rdquo;
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className={cn(
                'group flex w-full items-center gap-2 px-3 py-2.5 transition-colors hover:bg-muted/60',
                activeId === conv.id && 'bg-muted',
              )}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelect(conv.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(conv.id);
                  }
                }}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
              >
                <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{conv.title || 'New Chat'}</p>
                  <p className="text-xs text-muted-foreground">{new Date(conv.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDelete(conv.id)}
                className="shrink-0 p-1 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                aria-label="Delete conversation"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-border p-3 space-y-2">
        {/* Mode toggle -- only show if both options are available */}
        {providers.length > 0 && installedExecutors.length > 0 && (
          <div
            data-tour={TOUR_TARGETS.chatBackendSwitch}
            className="flex rounded-md border border-border overflow-hidden"
          >
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
            <div data-tour={TOUR_TARGETS.chatProviderSelect} className="space-y-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Provider</span>
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
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Model
                {modelsLoading && <Loader2 className="inline ml-1 h-3 w-3 animate-spin" />}
              </span>
              <Combobox
                options={models}
                value={selectedModel}
                onValueChange={onModelChange}
                placeholder={
                  !selectedProviderId ? 'Select provider first' : modelsLoading ? 'Loading...' : 'Select model'
                }
                searchPlaceholder="Search models..."
                emptyText="No models found."
                disabled={!selectedProviderId || modelsLoading}
                className="h-8 text-xs"
              />
            </div>
          </>
        ) : (
          <div data-tour={TOUR_TARGETS.chatProviderSelect} className="space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">CLI Agent</span>
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
        )}
      </div>
    </div>
  );
}
