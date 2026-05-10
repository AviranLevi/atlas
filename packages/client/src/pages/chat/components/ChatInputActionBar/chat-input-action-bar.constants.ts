// Types
import type { ExecutionMode } from '@atlas/shared';
import type { LucideIcon } from 'lucide-react';

// External
import { CheckCheck, FileText, Zap } from 'lucide-react';

export type ExecMode = {
  value: ExecutionMode;
  label: string;
  Icon: LucideIcon;
  description: string;
};

export const EXEC_MODES: ExecMode[] = [
  { value: 'auto', label: 'Auto', Icon: Zap, description: 'Execute actions immediately' },
  { value: 'confirm', label: 'Confirm', Icon: CheckCheck, description: 'Propose actions and wait for approval' },
  { value: 'plan-only', label: 'Plan', Icon: FileText, description: 'Plans only, no execution' },
];
