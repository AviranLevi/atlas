// Types
import type { Project, ProjectScanData, ProjectStatus, Task, Phase, Agent } from '@atlas/shared';
import type { UseMutationResult } from '@tanstack/react-query';

export type ProjectAgent = Agent & { role: string | null };

export type ProjectHeaderProps = {
  project: Project;
  statusConfig: { label: string; className: string };
  scanProject: UseMutationResult<unknown, Error, string>;
  onEdit: () => void;
};

export type ScanDataSectionProps = {
  scanData: ProjectScanData;
};

export type ProjectBriefSectionProps = {
  project: Project;
  generateBrief: UseMutationResult<unknown, Error, string>;
};

export type ProjectAgentsSectionProps = {
  projectId: string;
  projectAgents: ProjectAgent[];
  unassignedAgents: Agent[];
  assignPopoverOpen: boolean;
  onAssignPopoverOpenChange: (open: boolean) => void;
  onAssign: (agentId: string) => void;
  onUnassign: (agentId: string) => void;
};

export type ProjectTasksTableProps = {
  tasks: Task[];
  projectId: string;
  onNavigateToKanban: () => void;
};

export type ProjectMemoriesSectionProps = {
  memories: Record<string, unknown>[];
};

export type DetectedRulesSectionProps = {
  projectId: string;
  aiConfigs: NonNullable<ProjectScanData['aiConfigs']>;
};
