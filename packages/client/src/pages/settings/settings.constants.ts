// Types
import type { RuleForm } from './settings.types';

export const NONE_SKILL_VALUE = '__none__';

export const emptyRuleForm: RuleForm = {
  pattern: '',
  agentId: '',
  skillId: NONE_SKILL_VALUE,
  autoStart: false,
};
