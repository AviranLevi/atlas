// React / library
import { Plus, X } from 'lucide-react';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Types
import type { AttachableItemsSectionProps } from '../agent-detail.types';

/**
 * Generic attach/detach list section used for both Skills and Rules
 * on the agent detail page.
 */
export function AttachableItemsSection({
  icon: Icon,
  label,
  items,
  unattachedItems,
  popoverOpen,
  onPopoverOpenChange,
  onAttach,
  onDetach,
  attachLabel,
  emptyMessage,
  badgeVariant = 'secondary',
}: AttachableItemsSectionProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="text-muted-foreground h-4 w-4" />
          <h2 className="text-sm font-semibold">
            {label} ({items.length})
          </h2>
        </div>
        <Popover open={popoverOpen} onOpenChange={onPopoverOpenChange}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              {attachLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-2">
            <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Available {label}</p>
            {unattachedItems.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                All {label.toLowerCase()} are attached.
              </p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {unattachedItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                    onClick={() => {
                      onAttach(item.id);
                      onPopoverOpenChange(false);
                    }}
                  >
                    <span className="truncate">{item.name}</span>
                    <Badge variant={badgeVariant} className="ml-auto shrink-0 text-[10px]">
                      {item.type}
                    </Badge>
                    <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <Icon className="text-muted-foreground mx-auto mb-2 h-6 w-6" />
          <p className="text-muted-foreground text-xs">{emptyMessage}</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Card key={item.id} className="group relative flex items-center gap-2 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <Badge variant={badgeVariant} className="text-[10px]">
                  {item.type}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => onDetach(item.id)}
                aria-label={`Detach ${item.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
