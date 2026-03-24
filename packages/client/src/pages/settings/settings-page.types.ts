import type { Agent, Skill, DispatchRule } from '@my-agents/shared';

export type RuleForm = {
  pattern: string;
  agentId: string;
  skillId: string;
};

export type GlobalInstructionsCardProps = {
  instructions: string;
  isLoading: boolean;
  isDirty: boolean;
  isSaving: boolean;
  isSaved: boolean;
  error: string | null;
  onChange: (value: string) => void;
  onSave: () => void;
};

export type DispatchRuleFormRowProps = {
  form: RuleForm;
  agents: Agent[];
  skills: Skill[];
  isSaving: boolean;
  isValid: boolean;
  onChange: (form: RuleForm) => void;
  onSave: () => void;
  onCancel: () => void;
};

export type DispatchRulesCardProps = {
  rules: DispatchRule[];
  isLoading: boolean;
  agents: Agent[];
  skills: Skill[];
  editingRuleId: string | null;
  ruleForm: RuleForm;
  isFormValid: boolean;
  isSaving: boolean;
  error: string | null;
  onFormChange: (form: RuleForm) => void;
  onAdd: () => void;
  onEdit: (rule: DispatchRule) => void;
  onDelete: (id: string) => void;
  onSave: () => void;
  onCancel: () => void;
  getAgentName: (id: string) => string;
  getSkillName: (id: string | null) => string;
};
