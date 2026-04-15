// Shared
import type { AgentBehavior, GlobalInstructions, Memory, Phase, Project, ProjectDoc, Task } from '@atlas/shared';

// Services
import type { AgentContext } from '../agents/agents.types.js';

export type PromptBuildParams = {
  taskId: string;
  projectId: string;
  agentId?: string | null;
  hasMcpAccess?: boolean;
  /** Workflow stage — changes the agent's instructions for this workspace */
  workflowStage?: 'brainstorm' | 'plan' | 'execute' | null;
};

/**
 * Pre-fetched data bag passed to every section builder.
 * Built once at the top of `build()` to avoid scattered service calls.
 */
export type PromptContext = {
  task: Task;
  project: Project;
  phase: Phase | null;
  agentContext: AgentContext | null;
  globalInstructions: GlobalInstructions[];
  allProjectMemories: Memory[];
  pinnedMemories: Memory[];
  pinnedIds: Set<string>;
  supermemoryResults: string[];
  allDocs: ProjectDoc[];
  scripts: Record<string, string> | undefined;
  behavior: AgentBehavior;
  recentMemories: Memory[];
  legacyUniqueMemories: Memory[];
  params: PromptBuildParams;
};
