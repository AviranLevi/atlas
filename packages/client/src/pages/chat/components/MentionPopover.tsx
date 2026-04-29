// React / library
import { Bot } from 'lucide-react';

// Components
import { Command, CommandEmpty, CommandItem, CommandList } from '@/components/ui/command';

// Types
import type { Agent } from '@atlas/shared';

type MentionPopoverProps = {
  mentionQuery: string | null;
  filteredAgents: Agent[];
  onSelect: (agent: { id: string; name: string }) => void;
};

/** Floating agent-picker popover that appears while the user is typing an @-mention. */
export function MentionPopover({ mentionQuery, filteredAgents, onSelect }: MentionPopoverProps) {
  if (mentionQuery === null) return null;

  return (
    <div className="relative">
      <div className="absolute bottom-0 left-0 z-50 w-64 rounded-md border bg-popover shadow-md">
        <Command shouldFilter={false}>
          <CommandList>
            {filteredAgents.length === 0 ? (
              <CommandEmpty>No agents found</CommandEmpty>
            ) : (
              filteredAgents.map((agent) => (
                <CommandItem key={agent.id} onSelect={() => onSelect(agent)}>
                  <Bot className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">{agent.name}</span>
                  {agent.description && (
                    <span className="ml-auto truncate max-w-[120px] text-xs text-muted-foreground">
                      {agent.description}
                    </span>
                  )}
                </CommandItem>
              ))
            )}
          </CommandList>
        </Command>
      </div>
    </div>
  );
}
