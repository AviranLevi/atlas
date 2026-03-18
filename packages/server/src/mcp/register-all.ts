import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAgentTools } from './agents.tools.js';
import { registerTaskTools } from './tasks.tools.js';
import { registerMemoryTools } from './memory.tools.js';
import { registerProjectTools } from './projects.tools.js';
import { registerRuleTools } from './rules.tools.js';
import { registerSkillTools } from './skills.tools.js';
import { registerSettingsTools } from './settings.tools.js';
import { registerSearchTools } from './search.tools.js';
import { registerWorkspaceTools } from './workspaces.tools.js';

export function registerAllTools(server: McpServer) {
  registerAgentTools(server);
  registerTaskTools(server);
  registerMemoryTools(server);
  registerProjectTools(server);
  registerRuleTools(server);
  registerSkillTools(server);
  registerSettingsTools(server);
  registerSearchTools(server);
  registerWorkspaceTools(server);
}
