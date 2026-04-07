export const SKILL_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'Planning', label: 'Planning' },
  { value: 'Coding', label: 'Coding' },
  { value: 'Review', label: 'Review' },
  { value: 'Architecture / Data', label: 'Architecture / Data' },
  { value: 'Planning / Roadmapping', label: 'Planning / Roadmapping' },
  { value: 'Design / Systems', label: 'Design / Systems' },
  { value: 'Design', label: 'Design' },
  { value: 'Design / Balancing', label: 'Design / Balancing' },
] as const;

export const PROJECT_SCOPE_ALL = 'all';
export const PROJECT_SCOPE_GLOBAL = 'global';

export const SKILL_TYPE_COLORS: Record<string, string> = {
  Planning: 'border-l-amber-500',
  Coding: 'border-l-blue-500',
  Review: 'border-l-green-500',
  'Architecture / Data': 'border-l-indigo-500',
  'Planning / Roadmapping': 'border-l-orange-500',
  'Design / Systems': 'border-l-pink-500',
  Design: 'border-l-rose-500',
  'Design / Balancing': 'border-l-purple-500',
};
