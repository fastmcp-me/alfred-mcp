/**
 * Connections API Tools - MCP tool definitions for Alfred Connections management
 *
 * Provides MCP tools for listing, creating, retrieving, updating, and deleting connections.
 * Each tool wraps the corresponding AlfredClient method and returns formatted JSON responses.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AlfredClient } from "../client.js";

/**
 * Zod schema for creating a new connection
 */
const CreateConnectionInputSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(255)
    .describe("Name of the connection (1-255 characters)"),
  type: z
    .string()
    .min(1)
    .describe("Type of connection (e.g., 'slack', 'github', 'composio')"),
  config: z
    .record(z.any())
    .describe("Configuration object for the connection (structure varies by type)"),
  isActive: z
    .boolean()
    .default(true)
    .describe("Whether the connection is currently active"),
});

/**
 * Zod schema for updating an existing connection (all fields optional)
 */
const UpdateConnectionInputSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(255)
    .optional()
    .describe("Updated connection name"),
  type: z
    .string()
    .min(1)
    .optional()
    .describe("Updated connection type"),
  config: z
    .record(z.any())
    .optional()
    .describe("Updated configuration object"),
  isActive: z
    .boolean()
    .optional()
    .describe("Updated active status"),
});

/**
 * Zod schema for listing connections with optional filters
 */
const ListConnectionsInputSchema = z.object({
  isActive: z
    .boolean()
    .optional()
    .describe("Filter by active status"),
  type: z
    .string()
    .optional()
    .describe("Filter by connection type"),
  source: z
    .string()
    .optional()
    .describe("Filter by source"),
  authStatus: z
    .string()
    .optional()
    .describe("Filter by authentication status"),
  limit: z
    .number()
    .int()
    .positive()
    .optional()
    .default(50)
    .describe("Maximum number of connections to return (default: 50)"),
  offset: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .default(0)
    .describe("Number of connections to skip for pagination (default: 0)"),
  sortBy: z
    .string()
    .optional()
    .describe("Field to sort by (e.g., 'name', 'createdAt')"),
  sortOrder: z
    .enum(["asc", "desc"])
    .optional()
    .describe("Sort order: ascending or descending"),
});

/**
 * Register all Connections API tools with the MCP server
 *
 * @param server - The MCP server instance to register tools with
 * @param client - The Alfred API client for making requests
 */
export async function registerConnectionsTools(
  server: McpServer,
  client: AlfredClient
): Promise<void> {
  /**
   * Tool: alfred_list_connections
   * Lists all connections with optional filtering and pagination
   */
  server.registerTool(
    "alfred_list_connections",
    {
      title: "List Connections",
      description:
        "List all Alfred connections with optional filtering, sorting, and pagination",
      inputSchema: ListConnectionsInputSchema,
    },
    async (input) => {
      try {
        const response = await client.listConnections({
          isActive: input.isActive,
          type: input.type,
          source: input.source,
          authStatus: input.authStatus,
          limit: input.limit || 50,
          offset: input.offset || 0,
          sortBy: input.sortBy,
          sortOrder: input.sortOrder,
        });

        if (!response.success) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: response.error || "Failed to list connections",
                  success: false,
                }),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                connections: response.data || [],
                pagination: response.meta || undefined,
              }),
            },
          ],
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `Failed to list connections: ${message}`,
                success: false,
              }),
            },
          ],
        };
      }
    }
  );

  /**
   * Tool: alfred_get_connection
   * Retrieve a specific connection by ID
   */
  server.registerTool(
    "alfred_get_connection",
    {
      title: "Get Connection",
      description: "Retrieve a specific connection by its ID",
      inputSchema: z.object({
        connectionId: z.string().describe("The ID of the connection to retrieve"),
      }),
    },
    async (input) => {
      try {
        const response = await client.getConnection(input.connectionId);

        if (!response.success) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: response.error || "Connection not found",
                  success: false,
                }),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                connection: response.data,
              }),
            },
          ],
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `Failed to retrieve connection: ${message}`,
                success: false,
              }),
            },
          ],
        };
      }
    }
  );

  /**
   * Tool: alfred_create_connection
   * Create a new connection with configuration
   */
  server.registerTool(
    "alfred_create_connection",
    {
      title: "Create Connection",
      description:
        "Create a new connection with name, type, and configuration",
      inputSchema: CreateConnectionInputSchema,
    },
    async (input) => {
      try {
        const connectionData = {
          name: input.name,
          type: input.type,
          config: input.config,
          isActive: input.isActive !== false,
        };

        const response = await client.createConnection(connectionData);

        if (!response.success) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: response.error || "Failed to create connection",
                  success: false,
                }),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                connection: response.data,
                message: `Connection "${input.name}" created successfully`,
              }),
            },
          ],
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `Failed to create connection: ${message}`,
                success: false,
              }),
            },
          ],
        };
      }
    }
  );

  /**
   * Tool: alfred_update_connection
   * Update an entire connection (all fields required - use PUT semantics)
   */
  server.registerTool(
    "alfred_update_connection",
    {
      title: "Update Connection",
      description:
        "Update a connection with a complete replacement (all fields should be provided)",
      inputSchema: z.object({
        connectionId: z.string().describe("The ID of the connection to update"),
        ...CreateConnectionInputSchema.shape,
      }),
    },
    async (input) => {
      try {
        const { connectionId, ...updateData } = input;

        const connectionData = {
          name: updateData.name,
          type: updateData.type,
          config: updateData.config,
          isActive: updateData.isActive !== false,
        };

        const response = await client.updateConnection(connectionId, connectionData);

        if (!response.success) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: response.error || "Failed to update connection",
                  success: false,
                }),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                connection: response.data,
                message: `Connection updated successfully`,
              }),
            },
          ],
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `Failed to update connection: ${message}`,
                success: false,
              }),
            },
          ],
        };
      }
    }
  );

  /**
   * Tool: alfred_patch_connection
   * Partially update a connection (only provided fields are updated)
   */
  server.registerTool(
    "alfred_patch_connection",
    {
      title: "Patch Connection",
      description:
        "Partially update a connection - only provided fields will be modified",
      inputSchema: z.object({
        connectionId: z.string().describe("The ID of the connection to patch"),
        name: z
          .string()
          .min(1)
          .max(255)
          .optional()
          .describe("Updated connection name"),
        type: z
          .string()
          .min(1)
          .optional()
          .describe("Updated connection type"),
        config: z
          .record(z.any())
          .optional()
          .describe("Updated configuration object"),
        isActive: z
          .boolean()
          .optional()
          .describe("Updated active status"),
      }),
    },
    async (input) => {
      try {
        const { connectionId, ...patchData } = input;

        // Build update object with only provided fields
        const updateFields: Record<string, any> = {};
        if (patchData.name !== undefined) updateFields.name = patchData.name;
        if (patchData.type !== undefined) updateFields.type = patchData.type;
        if (patchData.config !== undefined) updateFields.config = patchData.config;
        if (patchData.isActive !== undefined) updateFields.isActive = patchData.isActive;

        const response = await client.patchConnection(connectionId, updateFields);

        if (!response.success) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: response.error || "Failed to patch connection",
                  success: false,
                }),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                connection: response.data,
                message: `Connection patched successfully`,
              }),
            },
          ],
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `Failed to patch connection: ${message}`,
                success: false,
              }),
            },
          ],
        };
      }
    }
  );

  /**
   * Tool: alfred_delete_connection
   * Delete a connection by ID
   */
  server.registerTool(
    "alfred_delete_connection",
    {
      title: "Delete Connection",
      description: "Delete a connection by ID",
      inputSchema: z.object({
        connectionId: z.string().describe("The ID of the connection to delete"),
      }),
    },
    async (input) => {
      try {
        const response = await client.deleteConnection(input.connectionId);

        if (!response.success) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: response.error || "Failed to delete connection",
                  success: false,
                }),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `Connection deleted successfully`,
                deletedConnection: response.data,
              }),
            },
          ],
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `Failed to delete connection: ${message}`,
                success: false,
              }),
            },
          ],
        };
      }
    }
  );
}
