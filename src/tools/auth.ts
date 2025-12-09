/**
 * Auth API Tools for Alfred MCP Server
 * Provides tools for managing API keys
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AlfredClient } from "../client.js";
import type { ApiKey, CreateApiKeyResponse } from "../types.js";

/**
 * Register auth tools with the MCP server
 * Provides tools for creating, listing, and deleting API keys
 */
export function registerAuthTools(server: McpServer, client: AlfredClient): void {
  /**
   * Tool: alfred_create_api_key
   * Creates a new API key for authentication
   * WARNING: The API key is only shown once - store it securely!
   */
  server.registerTool(
    {
      name: "alfred_create_api_key",
      description:
        "Create a new API key for authenticating with the Alfred API. The API key will only be shown once - save it securely!",
      inputSchema: z.object({
        name: z
          .string()
          .min(1, "Name must not be empty")
          .max(255, "Name must not exceed 255 characters")
          .describe("Name of the API key"),
        description: z
          .string()
          .optional()
          .describe("Optional description of the API key's purpose"),
        expiresAt: z
          .string()
          .datetime()
          .optional()
          .describe("Optional ISO 8601 datetime when the API key should expire"),
      }),
    },
    async (request) => {
      try {
        const response = await client.createApiKey({
          name: request.params.name,
          description: request.params.description,
          expiresAt: request.params.expiresAt,
        });

        if (!response.success || !response.data) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: response.error || "Failed to create API key",
                    message: response.message,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        const apiKey = response.data as CreateApiKeyResponse;

        // Format the response with emphasis on the one-time key display
        const resultText = `API Key Created Successfully

WARNING: This is the only time the API key will be displayed. Save it securely immediately.

Key Details:
- ID: ${apiKey.id}
- Name: ${apiKey.name}
- Key: ${apiKey.key}
- Key Prefix: ${apiKey.keyPrefix}
${apiKey.description ? `- Description: ${apiKey.description}` : ""}
${apiKey.expiresAt ? `- Expires At: ${apiKey.expiresAt}` : "- Expires: Never"}
- Created At: ${apiKey.createdAt}
- Active: ${apiKey.isActive}

Use this API key in the X-API-Key header when making requests to the Alfred API.`;

        return {
          content: [
            {
              type: "text",
              text: resultText,
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: "Failed to create API key",
                  details: errorMessage,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );

  /**
   * Tool: alfred_list_api_keys
   * Lists all API keys for the authenticated user
   * Note: The actual API key values are never returned in list operations
   */
  server.registerTool(
    {
      name: "alfred_list_api_keys",
      description:
        "List all API keys associated with your Alfred account. Note: actual key values are not shown for security - only key IDs and metadata are returned.",
      inputSchema: z.object({}),
    },
    async (request) => {
      try {
        const response = await client.listApiKeys();

        if (!response.success || !response.data) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: response.error || "Failed to list API keys",
                    message: response.message,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        const apiKeys = response.data as ApiKey[];

        if (apiKeys.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No API keys found. Create one using alfred_create_api_key.",
              },
            ],
          };
        }

        // Format the list of API keys
        const keysText = apiKeys
          .map((key, index) => {
            return `${index + 1}. ${key.name}
   ID: ${key.id}
   Prefix: ${key.keyPrefix}
   Active: ${key.isActive}
   Created: ${key.createdAt}
   ${key.expiresAt ? `Expires: ${key.expiresAt}` : "Expires: Never"}
   ${key.lastUsedAt ? `Last Used: ${key.lastUsedAt}` : "Last Used: Never"}
   ${key.description ? `Description: ${key.description}` : ""}`;
          })
          .join("\n\n");

        const resultText = `API Keys (${apiKeys.length} total)

${keysText}

Note: For security, full API key values are never returned in list operations.
If you need a new key, use alfred_create_api_key.`;

        return {
          content: [
            {
              type: "text",
              text: resultText,
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: "Failed to list API keys",
                  details: errorMessage,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );

  /**
   * Tool: alfred_delete_api_key
   * Deletes an API key by ID
   * This action is permanent and cannot be undone
   */
  server.registerTool(
    {
      name: "alfred_delete_api_key",
      description:
        "Delete an API key by ID. This action is permanent and cannot be undone. Any applications using this key will lose access.",
      inputSchema: z.object({
        id: z.string().min(1).describe("ID of the API key to delete"),
      }),
    },
    async (request) => {
      try {
        const response = await client.deleteApiKey(request.params.id);

        if (!response.success) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: response.error || "Failed to delete API key",
                    message: response.message,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        const deletedKey = response.data as ApiKey;

        const resultText = `API Key Deleted Successfully

Deleted Key:
- ID: ${deletedKey.id}
- Name: ${deletedKey.name}
- Key Prefix: ${deletedKey.keyPrefix}

This API key is now invalid and can no longer be used to authenticate.
Any applications or integrations using this key will lose access.`;

        return {
          content: [
            {
              type: "text",
              text: resultText,
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: "Failed to delete API key",
                  details: errorMessage,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
