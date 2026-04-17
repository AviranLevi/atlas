// Shared
import type { CommitStep, Memory } from '@atlas/shared';
import { WorkflowOutputSchema } from '@atlas/shared';

// Repositories
import { projectDocsRepository, workspacesRepository } from '../../db/repositories/index.js';

// Services
import {
  agentsService,
  memoryService,
  phasesService,
  projectsService,
  settingsService,
  supermemoryService,
  tasksService,
} from '../index.js';

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

// Local
import type { PromptBuildParams, PromptContext } from './prompt-builder.types.js';
import {
  buildAgentIdentitySection,
  buildDesignContextSection,
  buildGlobalInstructionsSection,
  buildInstructionsSection,
  buildMissionSection,
  buildPhaseSection,
  buildPinnedMemoriesSection,
  buildProjectContextSection,
  buildProjectDocsSection,
  buildSupermemorySection,
  buildTaskSection,
  buildVerificationSection,
} from './prompt-sections.js';

export type { PromptBuildParams } from './prompt-builder.types.js';

const FILE_PATH = 'services/prompt-builder/prompt-builder.service.ts';

/**
 * Max number of individual memories to include in the prompt.
 * The project brief already contains the top 15 condensed memories,
 * so we only include the most recent ones that might not be in the brief yet.
 */
const MAX_RECENT_MEMORIES = 5;

export class PromptBuilderService {
  /**
   * Builds a structured markdown prompt that gives the agent full context
   * about the task, project, and its own identity/instructions.
   *
   * Context strategy:
   * - Project brief (compact, ~300-600 tokens) — always included
   * - Recent memories not yet in brief — up to MAX_RECENT_MEMORIES
   * - Full memory list available via MCP `list_memories` tool (lazy loading)
   */
  async build(params: PromptBuildParams): Promise<string> {
    const FUNCTION_NAME = 'build';
    try {
      const ctx = await this.buildContext(params);

      const sections = [
        buildMissionSection(ctx),
        buildPhaseSection(ctx),
        buildGlobalInstructionsSection(ctx),
        buildAgentIdentitySection(ctx),
        buildSupermemorySection(ctx),
        buildDesignContextSection(ctx),
        buildProjectDocsSection(ctx),
        buildPinnedMemoriesSection(ctx),
        buildProjectContextSection(ctx),
        buildTaskSection(ctx),
        buildVerificationSection(ctx),
        buildInstructionsSection(ctx),
      ];

      return sections.filter(Boolean).join('\n\n---\n\n');
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to build prompt', { cause: error });
    }
  }

  /** Fetches all data needed by the section builders in one place. */
  private async buildContext(params: PromptBuildParams): Promise<PromptContext> {
    const task = await tasksService.getById(params.taskId);
    const projectContext = await projectsService.getContext(params.projectId);
    const { project } = projectContext;

    // Phase lookup (optional — swallow errors)
    let phase = null;
    if (task.phaseId) {
      try {
        phase = await phasesService.getById(task.phaseId);
      } catch (error: unknown) {
        logger.warn('prompt-builder.service :: phase lookup failed', error);
      }
    }

    const [globalInstructions, agentContext, allProjectMemories, supermemoryResults] = await Promise.all([
      settingsService.listGlobalInstructions(),
      params.agentId ? agentsService.getContext(params.agentId, params.projectId) : Promise.resolve(null),
      memoryService.listByProject(params.projectId),
      supermemoryService.searchRelevant(task.name + (task.notes ? ` ${task.notes}` : ''), params.projectId),
    ]);

    const allDocs = projectDocsRepository.findByProjectId(params.projectId);
    const scripts = project.scanData?.scripts;

    const behavior = project.agentBehavior ?? {
      requireVerification: true,
      enforceNoStubs: true,
      workflowMode: 'off' as const,
      autoAiReview: false,
    };

    const pinnedMemories = allProjectMemories.filter((m) => m.isPinned);
    const pinnedIds = new Set(pinnedMemories.map((m) => m.id));

    const recentMemories = project.projectBrief
      ? await this.getRecentMemories(params.projectId, params.agentId, pinnedIds, allProjectMemories)
      : [];

    const legacyUniqueMemories = project.projectBrief
      ? []
      : await this.getLegacyUniqueMemories(allProjectMemories, params.agentId, pinnedIds);

    const commitPlan = params.workflowStage === 'execute'
      ? this.loadCommitPlanForTask(params.taskId)
      : null;

    return {
      task,
      project,
      phase,
      agentContext,
      globalInstructions,
      allProjectMemories,
      pinnedMemories,
      pinnedIds,
      supermemoryResults,
      allDocs,
      scripts,
      behavior,
      recentMemories,
      legacyUniqueMemories,
      commitPlan,
      params,
    };
  }

  /**
   * Get the most recent memories that were created/updated AFTER the brief
   * was last generated. These supplement the brief with fresh knowledge.
   * Pinned memories are excluded since they're already injected in the L0 tier.
   */
  private async getRecentMemories(
    projectId: string,
    agentId?: string | null,
    pinnedIds?: Set<string>,
    prefetched?: Memory[],
  ): Promise<Memory[]> {
    const allMemories = prefetched ?? (await memoryService.listByProject(projectId));
    const agentMemoryIds = await this.getAgentMemoryIds(agentId);

    const filtered = allMemories.filter((m) => !agentMemoryIds.has(m.id) && !pinnedIds?.has(m.id));

    return filtered
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, MAX_RECENT_MEMORIES);
  }

  /** Legacy path: all project memories minus agent-specific and pinned ones. */
  private async getLegacyUniqueMemories(
    allProjectMemories: Memory[],
    agentId?: string | null,
    pinnedIds?: Set<string>,
  ): Promise<Memory[]> {
    const agentMemoryIds = await this.getAgentMemoryIds(agentId);
    return allProjectMemories.filter((m) => !agentMemoryIds.has(m.id) && !pinnedIds?.has(m.id));
  }

  private async getAgentMemoryIds(agentId?: string | null): Promise<Set<string>> {
    if (!agentId) return new Set();
    const agentContext = await agentsService.getContext(agentId);
    return new Set(agentContext.memories.map((m) => m.id as string));
  }

  /** Extracts commitSteps from the completed plan workspace for a task. */
  private loadCommitPlanForTask(taskId: string): CommitStep[] | null {
    try {
      const allWorkspaces = workspacesRepository.findAllByTaskId(taskId);
      const planWorkspace = allWorkspaces.find(
        (w) => w.workflowStage === 'plan' && (w.status === 'completed' || w.status === 'approved'),
      );
      if (!planWorkspace?.output) return null;

      const parsed = WorkflowOutputSchema.parse(JSON.parse(planWorkspace.output));
      if (parsed.stage !== 'plan') return null;

      const { commitSteps } = parsed.data;
      return commitSteps && commitSteps.length > 0 ? commitSteps : null;
    } catch (e) {
      logger.warn(`${FILE_PATH} :: loadCommitPlanForTask - could not load commit plan`, e);
      return null;
    }
  }
}
