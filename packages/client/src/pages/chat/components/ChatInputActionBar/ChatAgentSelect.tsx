// React / library
import { Bot } from 'lucide-react';

// Components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Types
import type { ChatAgentSelectProps } from './chat-input-action-bar.types';

/** Agent picker shown in the chat input bar when agents are configured. */
export function ChatAgentSelect({ agents, selectedAgentId, onAgentChange }: ChatAgentSelectProps) {
  return (
    <Select value={selectedAgentId ?? ''} onValueChange={onAgentChange}>
      <SelectTrigger className="h-7 w-auto max-w-[160px] gap-1 border-0 bg-transparent px-2 text-xs text-muted-foreground shadow-none hover:bg-muted focus:ring-0">
        <Bot className="h-3 w-3 shrink-0" />
        <SelectValue placeholder="No agent" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="" className="text-xs">
          No agent
        </SelectItem>
        {agents.map((a) => (
          <SelectItem key={a.id} value={a.id} className="text-xs">
            {a.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
