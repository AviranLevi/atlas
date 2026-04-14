export const RULE_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'Backend', label: 'Backend' },
  { value: 'Frontend', label: 'Frontend' },
  { value: 'Godot', label: 'Godot' },
  { value: 'General', label: 'General' },
] as const;

export const RULE_TYPE_COLORS: Record<string, string> = {
  Backend: 'border-l-blue-500',
  Frontend: 'border-l-green-500',
  Godot: 'border-l-purple-500',
  General: 'border-l-gray-400',
};
