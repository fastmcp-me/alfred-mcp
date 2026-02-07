[![Add to Cursor](https://fastmcp.me/badges/cursor_dark.svg)](https://fastmcp.me/MCP/Details/1818/alfred-mcp-server)
[![Add to VS Code](https://fastmcp.me/badges/vscode_dark.svg)](https://fastmcp.me/MCP/Details/1818/alfred-mcp-server)
[![Add to Claude](https://fastmcp.me/badges/claude_dark.svg)](https://fastmcp.me/MCP/Details/1818/alfred-mcp-server)
[![Add to ChatGPT](https://fastmcp.me/badges/chatgpt_dark.svg)](https://fastmcp.me/MCP/Details/1818/alfred-mcp-server)
[![Add to Codex](https://fastmcp.me/badges/codex_dark.svg)](https://fastmcp.me/MCP/Details/1818/alfred-mcp-server)
[![Add to Gemini](https://fastmcp.me/badges/gemini_dark.svg)](https://fastmcp.me/MCP/Details/1818/alfred-mcp-server)

# Alfred MCP Server

> Model Context Protocol server that exposes Alfred's REST API as MCP tools for integration with Claude and other AI assistants.

## Overview

The Alfred MCP Server provides seamless integration between Alfred's workflow automation platform and AI assistants through the Model Context Protocol. This enables AI assistants to create, manage, and execute Alfred skills, manage connections, view execution history, and handle API keys.

### Key Features

- **20 MCP Tools** covering all Alfred API endpoints
- **Dual Transport Support**: HTTP (Smithery deployment) and STDIO (local Claude Desktop)
- **Type-Safe**: Built with TypeScript and Zod validation
- **Fully Documented**: Comprehensive tool descriptions and input schemas
- **Production Ready**: Error handling, timeouts, and proper authentication

## Tools Available

### Skills Management (6 tools)

- `alfred_list_skills` - List all skills with filtering, sorting, and pagination
- `alfred_get_skill` - Get detailed information about a specific skill
- `alfred_create_skill` - Create a new skill with steps and configuration
- `alfred_update_skill` - Update an entire skill (PUT semantics)
- `alfred_patch_skill` - Partially update a skill (PATCH semantics)
- `alfred_delete_skill` - Delete a skill (with optional force flag)

### Connections Management (6 tools)

- `alfred_list_connections` - List all MCP server connections
- `alfred_get_connection` - Get connection details by ID
- `alfred_create_connection` - Create a new MCP server connection
- `alfred_update_connection` - Update entire connection configuration
- `alfred_patch_connection` - Partially update connection settings
- `alfred_delete_connection` - Remove a connection

### Execution History (5 tools)

- `alfred_list_executions` - List execution history with filters
- `alfred_get_execution` - Get detailed execution information
- `alfred_get_execution_trace` - Get execution trace/logs for debugging
- `alfred_get_execution_stats` - Get analytics and statistics
- `alfred_delete_execution` - Delete an execution record

### API Key Management (3 tools)

- `alfred_create_api_key` - Create a new Alfred API key
- `alfred_list_api_keys` - List all API keys (without revealing full keys)
- `alfred_delete_api_key` - Revoke an API key

## Installation

### Option 1: STDIO Mode (Claude Desktop)

Add to your Claude Desktop configuration:

\`\`\`json
{
  "mcpServers": {
    "alfred": {
      "command": "npx",
      "args": ["-y", "@alfred/mcp-server"],
      "env": {
        "ALFRED_API_KEY": "alf_xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "ALFRED_BASE_URL": "http://localhost:3001/api/v1"
      }
    }
  }
}
\`\`\`

### Option 2: HTTP Mode (Smithery Deployment)

1. Visit [Smithery.ai](https://smithery.ai)
2. Search for "Alfred MCP Server"
3. Configure with your API key and base URL
4. Deploy with one click

## Configuration

### Required

- \`apiKey\` - Your Alfred API key (format: \`alf_xxx...\`)

### Optional

- \`baseUrl\` - Alfred API base URL (default: \`http://localhost:3001/api/v1\`)
- \`timeout\` - Request timeout in milliseconds (default: \`30000\`)

## Development

### Building

\`\`\`bash
# Install dependencies
npm install

# Build for STDIO mode
npm run build:stdio

# Build for HTTP deployment (Smithery)
npm run build
\`\`\`

### Project Structure

\`\`\`
alfred-mcp/
├── src/
│   ├── index.ts           # Main server with dual transport
│   ├── client.ts          # Alfred API client wrapper
│   ├── types.ts           # TypeScript type definitions
│   └── tools/
│       ├── skills.ts      # Skills management tools
│       ├── connections.ts # Connections management tools
│       ├── executions.ts  # Execution history tools
│       └── auth.ts        # API key management tools
├── package.json
├── tsconfig.json
└── smithery.yaml          # Smithery platform config
\`\`\`

## License

MIT
