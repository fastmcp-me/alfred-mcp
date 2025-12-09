/**
 * Executions API Tools
 * Tools for managing skill executions: listing, retrieving, tracing, stats, and deletion
 */

import z from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Execution, ExecutionStats } from "../types.js";
import type { AlfredClient } from "../client.js";

/**
 * Register all executions-related tools with the MCP server
 */
export async function registerExecutionsTools(
  server: McpServer,
  client: AlfredClient
): Promise<void> {
  // alfred_list_executions - List all executions with optional filtering
  server.registerTool(
    {
      name: "alfred_list_executions",
      description:
        "List executions with optional filtering by skill, status, trigger type, and date range",
      inputSchema: z.object({
        skillId: z.string().uuid().optional(),
        status: z
          .enum(["running", "completed", "failed"])
          .optional(),
        trigger: z.string().optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
        sortBy: z.string().optional(),
        sortOrder: z.enum(["asc", "desc"]).optional(),
      }),
    },
    async (request) => {
      try {
        const {
          skillId,
          status,
          trigger,
          startDate,
          endDate,
          limit,
          offset,
          sortBy,
          sortOrder,
        } = request.params;

        const response = await client.listExecutions({
          skillId,
          status,
          trigger,
          startDate,
          endDate,
          limit,
          offset,
          sortBy,
          sortOrder,
        });

        if (!response.success) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error listing executions: ${response.error || response.message}`,
              },
            ],
          };
        }

        const executions = response.data as Execution[];
        const meta = response.meta;

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  count: executions.length,
                  total: meta?.total || 0,
                  page: meta?.page || 1,
                  limit: meta?.limit || 50,
                  totalPages: meta?.totalPages || 0,
                  hasMore: meta?.hasMore || false,
                  executions: executions.map((e) => ({
                    id: e.id,
                    skillId: e.skillId,
                    status: e.status,
                    trigger: e.trigger,
                    startedAt: e.startedAt,
                    completedAt: e.completedAt,
                    durationMs: e.durationMs,
                    error: e.error || null,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to list executions: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // alfred_get_execution - Get execution details by ID
  server.registerTool(
    {
      name: "alfred_get_execution",
      description: "Get detailed information about a specific execution",
      inputSchema: z.object({
        executionId: z.string().uuid(),
      }),
    },
    async (request) => {
      try {
        const { executionId } = request.params;

        const response = await client.getExecution(executionId);

        if (!response.success) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error getting execution: ${response.error || response.message}`,
              },
            ],
          };
        }

        const execution = response.data as Execution;

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  execution: {
                    id: execution.id,
                    skillId: execution.skillId,
                    status: execution.status,
                    trigger: execution.trigger,
                    input: execution.input,
                    output: execution.output,
                    error: execution.error,
                    startedAt: execution.startedAt,
                    completedAt: execution.completedAt,
                    durationMs: execution.durationMs,
                    tokenCount: execution.tokenCount,
                    costUsd: execution.costUsd,
                    reportedToCore: execution.reportedToCore,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to get execution: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // alfred_get_execution_trace - Get execution trace/logs
  server.registerTool(
    {
      name: "alfred_get_execution_trace",
      description: "Get detailed trace/logs for a specific execution",
      inputSchema: z.object({
        executionId: z.string().uuid(),
      }),
    },
    async (request) => {
      try {
        const { executionId } = request.params;

        const response = await client.getExecutionTrace(executionId);

        if (!response.success) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error getting execution trace: ${response.error || response.message}`,
              },
            ],
          };
        }

        const trace = response.data;

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  executionId: executionId,
                  trace: trace,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to get execution trace: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // alfred_get_execution_stats - Get execution statistics
  server.registerTool(
    {
      name: "alfred_get_execution_stats",
      description:
        "Get execution statistics including success rates, duration averages, and costs",
      inputSchema: z.object({
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        skillId: z.string().uuid().optional(),
      }),
    },
    async (request) => {
      try {
        const { startDate, endDate, skillId } = request.params;

        const response = await client.getExecutionStats({
          startDate,
          endDate,
          skillId,
        });

        if (!response.success) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error getting execution stats: ${response.error || response.message}`,
              },
            ],
          };
        }

        const stats = response.data as ExecutionStats;

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  stats: {
                    overview: {
                      total: stats.overview.total,
                      successful: stats.overview.successful,
                      failed: stats.overview.failed,
                      running: stats.overview.running,
                      successRate: stats.overview.successRate,
                      totalCostUsd: stats.overview.totalCostUsd,
                      averageDurationMs: stats.overview.averageDurationMs,
                    },
                    bySkill: stats.bySkill.map((skill) => ({
                      skillId: skill.skillId,
                      skillName: skill.skillName,
                      count: skill.count,
                      successCount: skill.successCount,
                      avgDurationMs: skill.avgDurationMs,
                      totalCostUsd: skill.totalCostUsd,
                    })),
                    byDay: stats.byDay.map((day) => ({
                      date: day.date,
                      count: day.count,
                      successful: day.successful,
                      failed: day.failed,
                    })),
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to get execution stats: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // alfred_delete_execution - Delete an execution
  server.registerTool(
    {
      name: "alfred_delete_execution",
      description: "Delete a specific execution record",
      inputSchema: z.object({
        executionId: z.string().uuid(),
      }),
    },
    async (request) => {
      try {
        const { executionId } = request.params;

        const response = await client.deleteExecution(executionId);

        if (!response.success) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error deleting execution: ${response.error || response.message}`,
              },
            ],
          };
        }

        const execution = response.data as Execution;

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `Execution ${executionId} deleted successfully`,
                  execution: {
                    id: execution.id,
                    skillId: execution.skillId,
                    status: execution.status,
                    startedAt: execution.startedAt,
                    completedAt: execution.completedAt,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to delete execution: ${error.message}`,
            },
          ],
        };
      }
    }
  );
}
