/**
 * Alfred MCP Server - Main Entry Point
 *
 * This server exposes Alfred's REST API through the Model Context Protocol (MCP).
 * Supports both HTTP transport (Smithery deployment) and STDIO (local Claude Desktop).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { AlfredClient } from "./client.js";
import { registerSkillsTools } from "./tools/skills.js";
import { registerConnectionsTools } from "./tools/connections.js";
import { registerExecutionsTools } from "./tools/executions.js";
import { registerAuthTools } from "./tools/auth.js";

/**
 * Configuration schema for Alfred MCP Server
 * This is used by Smithery to validate and present configuration options to users
 */
export const configSchema = z.object({
  apiKey: z.string()
    .min(1)
    .describe("Alfred API key (format: alf_xxx...)"),

  baseUrl: z.string()
    .url()
    .default("http://localhost:3001/api/v1")
    .describe("Alfred API base URL"),

  timeout: z.number()
    .int()
    .positive()
    .default(30000)
    .describe("Request timeout in milliseconds"),
});

export type Config = z.infer<typeof configSchema>;

/**
 * Create and configure the MCP server
 * This function is called by both HTTP (Smithery) and STDIO transports
 *
 * @param config - User-provided configuration
 * @returns Configured MCP server
 */
export default function createServer({ config }: { config: Config }) {
  // Create MCP server instance
  const server = new McpServer({
    name: "alfred-api",
    version: "1.0.0",
  });

  // Initialize Alfred API client
  const client = new AlfredClient(config);

  // Register all tool categories
  console.error(`[Alfred MCP] Registering tools...`);

  registerSkillsTools(server, client);
  console.error(`[Alfred MCP] ✓ Skills tools registered (6 tools)`);

  registerConnectionsTools(server, client);
  console.error(`[Alfred MCP] ✓ Connections tools registered (6 tools)`);

  registerExecutionsTools(server, client);
  console.error(`[Alfred MCP] ✓ Executions tools registered (5 tools)`);

  registerAuthTools(server, client);
  console.error(`[Alfred MCP] ✓ Auth tools registered (3 tools)`);

  console.error(`[Alfred MCP] Server initialized successfully`);
  console.error(`[Alfred MCP] Connected to: ${config.baseUrl}`);
  console.error(`[Alfred MCP] Total tools: 20`);

  return server.server;
}

/**
 * STDIO Transport Entry Point
 *
 * This function runs when the server is executed directly (not imported by Smithery).
 * It reads configuration from environment variables and connects to STDIO transport
 * for local Claude Desktop integration.
 *
 * Usage:
 *   ALFRED_API_KEY=alf_xxx ALFRED_BASE_URL=http://localhost:3001/api/v1 node dist/index.js
 */
async function main() {
  console.error(`[Alfred MCP] Starting in STDIO mode...`);

  // Read configuration from environment variables
  const apiKey = process.env.ALFRED_API_KEY;
  if (!apiKey) {
    console.error("[Alfred MCP] ❌ Error: ALFRED_API_KEY environment variable is required");
    console.error("[Alfred MCP] Usage: ALFRED_API_KEY=alf_xxx node dist/index.js");
    process.exit(1);
  }

  // Build configuration from environment
  const config: Config = {
    apiKey,
    baseUrl: process.env.ALFRED_BASE_URL || "http://localhost:3001/api/v1",
    timeout: parseInt(process.env.ALFRED_TIMEOUT || "30000", 10),
  };

  // Validate configuration
  try {
    configSchema.parse(config);
  } catch (error) {
    console.error("[Alfred MCP] ❌ Configuration validation failed:");
    console.error(error);
    process.exit(1);
  }

  console.error(`[Alfred MCP] Configuration loaded:`);
  console.error(`[Alfred MCP]   Base URL: ${config.baseUrl}`);
  console.error(`[Alfred MCP]   API Key: ${config.apiKey.substring(0, 8)}...`);
  console.error(`[Alfred MCP]   Timeout: ${config.timeout}ms`);

  // Create server with configuration
  const server = createServer({ config });

  // Connect to STDIO transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("[Alfred MCP] ✓ Connected to STDIO transport");
  console.error("[Alfred MCP] Server ready - listening for requests...");
}

/**
 * Auto-run in STDIO mode when executed directly
 * (Not when imported by Smithery for HTTP transport)
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("[Alfred MCP] ❌ Fatal error:", error);
    process.exit(1);
  });
}
