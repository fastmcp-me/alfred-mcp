/**
 * Skills API Tools - MCP tool definitions for Alfred Skills management
 *
 * Provides MCP tools for listing, creating, retrieving, updating, and deleting skills.
 * Each tool wraps the corresponding AlfredClient method and returns formatted JSON responses.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AlfredClient } from "../client.js";
import type { SkillStep } from "../types.js";

/**
 * Zod schema for SkillStep validation
 */
const SkillStepSchema = z.object({
  id: z.number().describe("Unique step identifier within the skill"),
  prompt: z.string().min(1).describe("The prompt/instruction for this step"),
  guidance: z
    .string()
    .describe("Guidance text for LLM execution of this step"),
  allowedTools: z
    .array(z.string())
    .describe("List of allowed tool names for this step"),
  connectionNames: z
    .array(z.string())
    .optional()
    .describe("Optional list of MCP connection names for this step"),
});

/**
 * Zod schema for creating a new skill
 */
const CreateSkillInputSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(255)
    .describe("Name of the skill (1-255 characters)"),
  description: z
    .string()
    .optional()
    .describe("Optional description of what the skill does"),
  triggerType: z
    .enum(["manual", "scheduled", "webhook"])
    .describe("How the skill is triggered"),
  steps: z
    .array(SkillStepSchema)
    .min(1)
    .describe("Array of execution steps for the skill"),
  connectionNames: z
    .array(z.string())
    .optional()
    .describe("Optional list of MCP connection names available to the skill"),
  isActive: z
    .boolean()
    .default(true)
    .describe("Whether the skill is currently active"),
});

/**
 * Zod schema for updating an existing skill (all fields optional)
 */
const UpdateSkillInputSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(255)
    .optional()
    .describe("Updated skill name"),
  description: z
    .string()
    .optional()
    .describe("Updated skill description"),
  triggerType: z
    .enum(["manual", "scheduled", "webhook"])
    .optional()
    .describe("Updated trigger type"),
  steps: z
    .array(SkillStepSchema)
    .optional()
    .describe("Updated skill steps"),
  connectionNames: z
    .array(z.string())
    .optional()
    .describe("Updated connection names"),
  isActive: z
    .boolean()
    .optional()
    .describe("Updated active status"),
});

/**
 * Zod schema for patching a skill (for partial updates)
 */
const PatchSkillInputSchema = z.object({
  skillId: z.string().describe("ID of the skill to patch"),
  patches: UpdateSkillInputSchema.describe(
    "Object containing fields to update"
  ),
});

/**
 * Zod schema for listing skills with optional filters
 */
const ListSkillsInputSchema = z.object({
  isActive: z
    .boolean()
    .optional()
    .describe("Filter by active status"),
  triggerType: z
    .enum(["manual", "scheduled", "webhook"])
    .optional()
    .describe("Filter by trigger type"),
  isSystem: z
    .boolean()
    .optional()
    .describe("Filter by system skills (built-in vs user-defined)"),
  limit: z
    .number()
    .int()
    .positive()
    .optional()
    .default(50)
    .describe("Maximum number of skills to return (default: 50)"),
  offset: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .default(0)
    .describe("Number of skills to skip for pagination (default: 0)"),
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
 * Register all Skills API tools with the MCP server
 *
 * @param server - The MCP server instance to register tools with
 * @param client - The Alfred API client for making requests
 */
export async function registerSkillsTools(
  server: McpServer,
  client: AlfredClient
): Promise<void> {
  /**
   * Tool: alfred_list_skills
   * Lists all skills with optional filtering and pagination
   */
  server.registerTool(
    "alfred_list_skills",
    {
      title: "List Skills",
      description:
        "List all Alfred skills with optional filtering, sorting, and pagination",
      inputSchema: ListSkillsInputSchema,
    },
    async (input) => {
      try {
        const response = await client.listSkills({
          isActive: input.isActive,
          triggerType: input.triggerType,
          isSystem: input.isSystem,
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
                  error: response.error || "Failed to list skills",
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
                skills: response.data || [],
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
                error: `Failed to list skills: ${message}`,
                success: false,
              }),
            },
          ],
        };
      }
    }
  );

  /**
   * Tool: alfred_get_skill
   * Retrieve a specific skill by ID
   */
  server.registerTool(
    "alfred_get_skill",
    {
      title: "Get Skill",
      description: "Retrieve a specific skill by its ID",
      inputSchema: z.object({
        skillId: z.string().describe("The ID of the skill to retrieve"),
      }),
    },
    async (input) => {
      try {
        const response = await client.getSkill(input.skillId);

        if (!response.success) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: response.error || "Skill not found",
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
                skill: response.data,
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
                error: `Failed to retrieve skill: ${message}`,
                success: false,
              }),
            },
          ],
        };
      }
    }
  );

  /**
   * Tool: alfred_create_skill
   * Create a new skill with full configuration
   */
  server.registerTool(
    "alfred_create_skill",
    {
      title: "Create Skill",
      description:
        "Create a new skill with steps, connections, and trigger configuration",
      inputSchema: CreateSkillInputSchema,
    },
    async (input) => {
      try {
        const skillData = {
          name: input.name,
          description: input.description,
          triggerType: input.triggerType,
          steps: input.steps,
          connectionNames: input.connectionNames || [],
          isActive: input.isActive !== false,
        };

        const response = await client.createSkill(skillData);

        if (!response.success) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: response.error || "Failed to create skill",
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
                skill: response.data,
                message: `Skill "${input.name}" created successfully`,
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
                error: `Failed to create skill: ${message}`,
                success: false,
              }),
            },
          ],
        };
      }
    }
  );

  /**
   * Tool: alfred_update_skill
   * Update an entire skill (all fields required - use PUT semantics)
   */
  server.registerTool(
    "alfred_update_skill",
    {
      title: "Update Skill",
      description:
        "Update a skill with a complete replacement (all fields should be provided)",
      inputSchema: z.object({
        skillId: z.string().describe("The ID of the skill to update"),
        ...CreateSkillInputSchema.shape,
      }),
    },
    async (input) => {
      try {
        const { skillId, ...updateData } = input;

        const skillData = {
          name: updateData.name,
          description: updateData.description,
          triggerType: updateData.triggerType,
          steps: updateData.steps,
          connectionNames: updateData.connectionNames || [],
          isActive: updateData.isActive !== false,
        };

        const response = await client.updateSkill(skillId, skillData);

        if (!response.success) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: response.error || "Failed to update skill",
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
                skill: response.data,
                message: `Skill updated successfully`,
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
                error: `Failed to update skill: ${message}`,
                success: false,
              }),
            },
          ],
        };
      }
    }
  );

  /**
   * Tool: alfred_patch_skill
   * Partially update a skill (only provided fields are updated)
   */
  server.registerTool(
    "alfred_patch_skill",
    {
      title: "Patch Skill",
      description:
        "Partially update a skill - only provided fields will be modified",
      inputSchema: z.object({
        skillId: z.string().describe("The ID of the skill to patch"),
        name: z
          .string()
          .min(1)
          .max(255)
          .optional()
          .describe("Updated skill name"),
        description: z
          .string()
          .optional()
          .describe("Updated skill description"),
        triggerType: z
          .enum(["manual", "scheduled", "webhook"])
          .optional()
          .describe("Updated trigger type"),
        steps: z
          .array(SkillStepSchema)
          .optional()
          .describe("Updated skill steps"),
        connectionNames: z
          .array(z.string())
          .optional()
          .describe("Updated connection names"),
        isActive: z
          .boolean()
          .optional()
          .describe("Updated active status"),
      }),
    },
    async (input) => {
      try {
        const { skillId, ...patchData } = input;

        // Build update object with only provided fields
        const updateFields: Record<string, any> = {};
        if (patchData.name !== undefined) updateFields.name = patchData.name;
        if (patchData.description !== undefined)
          updateFields.description = patchData.description;
        if (patchData.triggerType !== undefined)
          updateFields.triggerType = patchData.triggerType;
        if (patchData.steps !== undefined) updateFields.steps = patchData.steps;
        if (patchData.connectionNames !== undefined)
          updateFields.connectionNames = patchData.connectionNames;
        if (patchData.isActive !== undefined)
          updateFields.isActive = patchData.isActive;

        const response = await client.patchSkill(skillId, updateFields);

        if (!response.success) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: response.error || "Failed to patch skill",
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
                skill: response.data,
                message: `Skill patched successfully`,
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
                error: `Failed to patch skill: ${message}`,
                success: false,
              }),
            },
          ],
        };
      }
    }
  );

  /**
   * Tool: alfred_delete_skill
   * Delete a skill by ID with optional force flag
   */
  server.registerTool(
    "alfred_delete_skill",
    {
      title: "Delete Skill",
      description: "Delete a skill by ID with optional force delete",
      inputSchema: z.object({
        skillId: z.string().describe("The ID of the skill to delete"),
        force: z
          .boolean()
          .optional()
          .describe(
            "Force delete even if skill has recent executions (default: false)"
          ),
      }),
    },
    async (input) => {
      try {
        const response = await client.deleteSkill(input.skillId, input.force);

        if (!response.success) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: response.error || "Failed to delete skill",
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
                message: `Skill deleted successfully`,
                deletedSkill: response.data,
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
                error: `Failed to delete skill: ${message}`,
                success: false,
              }),
            },
          ],
        };
      }
    }
  );
}
