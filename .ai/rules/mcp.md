# MCP Tools

> Applies to: `packages/server/src/mcp/**/*.ts`

The MCP server exposes tools over stdio so AI agents (Cursor, Claude, etc.) can interact with the local database through the same service layer the REST API uses.

## File Structure

```
packages/server/src/
  mcp.ts                   # Entry point: McpServer + StdioServerTransport
  mcp/
    register-all.ts        # Barrel that wires all tool modules to the server
    agents.tools.ts
    tasks.tools.ts
    memory.tools.ts
    projects.tools.ts
    rules.tools.ts
    skills.tools.ts
    settings.tools.ts
    search.tools.ts
```

## Tool File Pattern

One file per entity. Export a single `register<Entity>Tools(server)` function.

```typescript
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { agentsService } from '../services/index.js';

export function registerAgentTools(server: McpServer) {
  server.registerTool('list_agents', {
    description: 'List all available AI agents',
    inputSchema: z.object({}),
  }, async () => {
    const agents = await agentsService.list();
    return { content: [{ type: 'text' as const, text: JSON.stringify(agents, null, 2) }] };
  });
}
```

## Rules

- Tool names: `snake_case` verbs (`list_agents`, `get_agent`, `create_task`, `update_task`).
- Input validation: use `z.object({})` with `.describe()` on each field so agents get parameter documentation.
- Return format: always `{ content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }`.
- Tools contain ZERO business logic. Validate input, call service, serialize response.
- One tool file per entity, mirroring the service/route split.
- All tool modules are registered in `register-all.ts` via `registerAllTools(server)`.

## Entry Point (`mcp.ts`)

- Calls `useStderrLogger()` before anything else to redirect app logs to `stderr` and keep `stdout` clean for JSON-RPC.
- Creates `McpServer` with app name and version.
- Calls `registerAllTools(server)`.
- Connects via `StdioServerTransport`.

## Scripts

- `packages/server/package.json`: `"mcp": "tsx src/mcp.ts"`
- Root `package.json`: `"mcp": "npm run mcp -w packages/server"`
