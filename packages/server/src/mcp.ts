// NPM
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
// Utils
import { useStderrLogger } from './lib/logger.js';
// Local
import { registerAllTools } from './mcp/register-all.js';

useStderrLogger();

const server = new McpServer({
  name: 'my-agents',
  version: '0.0.1',
});

registerAllTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('my-agents MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
