// NPM
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
// Utils
import { useStderrLogger } from './lib/logger.js';
// Local
import { registerAllTools } from './mcp/register-all.js';

useStderrLogger();

console.error('[MCP] Initializing atlas MCP server...');
console.error(`[MCP] cwd: ${process.cwd()}`);

const server = new McpServer({
  name: 'atlas',
  version: '0.0.1',
});

try {
  registerAllTools(server);
  console.error('[MCP] All tools registered successfully');
} catch (error) {
  console.error('[MCP] Failed to register tools:', error);
  process.exit(1);
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[MCP] atlas MCP server running on stdio');
}

main().catch((error) => {
  console.error('[MCP] Fatal error:', error);
  process.exit(1);
});
