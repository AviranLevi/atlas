// DB
import { db } from '../index.js';

// Repositories
import { AgentsRepository } from './agents.repository.js';
import { SkillsRepository } from './skills.repository.js';
import { RulesRepository } from './rules.repository.js';
import { MemoryRepository } from './memory.repository.js';
import { TasksRepository } from './tasks.repository.js';
import { ProjectsRepository } from './projects.repository.js';
import { SettingsRepository } from './settings.repository.js';
import { WorkspacesRepository } from './workspaces.repository.js';
import { AgentProvidersRepository } from './agent-providers.repository.js';
import { PhasesRepository } from './phases.repository.js';
import { ReviewsRepository } from './reviews.repository.js';
import { ActivityLogRepository } from './activity-log.repository.js';

export const agentsRepository = new AgentsRepository(db);
export const skillsRepository = new SkillsRepository(db);
export const rulesRepository = new RulesRepository(db);
export const memoryRepository = new MemoryRepository(db);
export const tasksRepository = new TasksRepository(db);
export const projectsRepository = new ProjectsRepository(db);
export const settingsRepository = new SettingsRepository(db);
export const workspacesRepository = new WorkspacesRepository(db);
export const agentProvidersRepository = new AgentProvidersRepository(db);
export const phasesRepository = new PhasesRepository(db);
export const reviewsRepository = new ReviewsRepository(db);
export const activityLogRepository = new ActivityLogRepository(db);
