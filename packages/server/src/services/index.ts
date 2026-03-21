import { AgentsService } from './agents.service.js';
import { SkillsService } from './skills.service.js';
import { RulesService } from './rules.service.js';
import { MemoryService } from './memory.service.js';
import { TasksService } from './tasks.service.js';
import { ProjectsService } from './projects.service.js';
import { SettingsService } from './settings.service.js';
import { SearchService } from './search.service.js';
import { ActivityLogService } from './activity-log.service.js';
import { AgentProvidersService } from './agent-providers.service.js';
import { PhasesService } from './phases.service.js';
import { ReviewsService } from './reviews.service.js';

export const activityLogService = new ActivityLogService();
export const agentsService = new AgentsService();
export const skillsService = new SkillsService();
export const rulesService = new RulesService();
export const memoryService = new MemoryService();
export const tasksService = new TasksService();
export const projectsService = new ProjectsService();
export const settingsService = new SettingsService();
export const searchService = new SearchService();
export const agentProvidersService = new AgentProvidersService();
export const phasesService = new PhasesService();
export const reviewsService = new ReviewsService();

import { WorktreeService } from './worktree.service.js';
import { PromptBuilderService } from './prompt-builder.service.js';
import { OrchestratorService } from './orchestrator.service.js';

export const worktreeService = new WorktreeService();
export const promptBuilderService = new PromptBuilderService();
export const orchestratorService = new OrchestratorService();
