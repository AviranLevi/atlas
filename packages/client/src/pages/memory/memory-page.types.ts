import type { Memory } from '@my-agents/shared';

export type MemoryTableProps = {
  memories: Memory[];
  projectMap: Map<string, string>;
  onEdit: (memory: Memory) => void;
  onDelete: (id: string) => void;
};
