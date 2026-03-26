export type SearchResult = {
  type: 'agent' | 'skill' | 'rule' | 'memory' | 'task' | 'project';
  id: string;
  name: string;
  snippet?: string;
};
