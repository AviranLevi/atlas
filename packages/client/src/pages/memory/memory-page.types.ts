import type { Memory } from '@my-agents/shared';

export type SortKey = 'name' | 'type' | 'lastUsed' | 'createdAt';
export type SortDir = 'asc' | 'desc';

export type MemoryTableProps = {
  memories: Memory[];
  projectMap: Map<string, string>;
  agentMap: Map<string, string>;
  onDelete: (id: string) => void;
};

export type MemoryExpandedRowProps = {
  memory: Memory;
  projectMap: Map<string, string>;
  agentMap: Map<string, string>;
};
