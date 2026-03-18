import { AgentsService } from './agents.service.js';
import { SkillsService } from './skills.service.js';
import { RulesService } from './rules.service.js';
import { MemoryService } from './memory.service.js';
import { TasksService } from './tasks.service.js';
import { ProjectsService } from './projects.service.js';
import { SettingsService } from './settings.service.js';
import { SearchService } from './search.service.js';

export const agentsService = new AgentsService();
export const skillsService = new SkillsService();
export const rulesService = new RulesService();
export const memoryService = new MemoryService();
export const tasksService = new TasksService();
export const projectsService = new ProjectsService();
export const settingsService = new SettingsService();
export const searchService = new SearchService();

import { WorktreeService } from './worktree.service.js';
import { PromptBuilderService } from './prompt-builder.service.js';
import { OrchestratorService } from './orchestrator.service.js';

export const worktreeService = new WorktreeService();
export const promptBuilderService = new PromptBuilderService();
export const orchestratorService = new OrchestratorService();
