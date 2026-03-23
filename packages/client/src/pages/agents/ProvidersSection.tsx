// React / library
import { Cpu, Plus, Pencil, Trash2 } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProviderTypeBadge } from '@/components/agents/ProviderTypeBadge';

// Types
import type { ProvidersSectionProps } from './agents-page.types';

export function ProvidersSection({
  providers,
  isLoading,
  onEdit,
  onCreate,
  onDelete,
}: ProvidersSectionProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <Cpu className="h-5 w-5 text-muted-foreground" />
            AI Providers
          </h2>
          <p className="text-muted-foreground mt-0.5 text-sm">API keys and model configurations</p>
        </div>
        <Button onClick={onCreate} size="sm" variant="outline">
          <Plus className="mr-1.5 h-4 w-4" />
          Add Provider
        </Button>
      </div>

      {isLoading ? (
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
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(provider)} aria-label="Edit provider">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(provider.id)} aria-label="Delete provider">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
