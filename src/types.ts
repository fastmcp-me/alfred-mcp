/**
 * Type definitions for Alfred MCP Server
 */

export interface AlfredApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
  sortBy?: string;
  sortOrder?: string;
}

export interface Skill {
  id: string;
  templateId?: string | null;
  name: string;
  description?: string | null;
  triggerType: 'manual' | 'scheduled' | 'webhook';
  triggerConfig?: any | null;
  steps: SkillStep[];
  connectionNames: string[];
  isSystem: boolean;
  isActive: boolean;
  runCount: number;
  lastRunAt?: string | null;
  composioUserId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SkillStep {
  id: number;
  prompt: string;
  guidance: string;
  allowedTools: string[];
  connectionNames?: string[];
}

export interface Connection {
  id: string;
  name: string;
  type: string;
  config: any;
  tools: string[];
  isActive: boolean;
  lastUsedAt?: string | null;
  source: string;
  composioAccountId?: string | null;
  composioToolkit?: string | null;
  authStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface Execution {
  id: string;
  skillId: string;
  status: 'running' | 'completed' | 'failed';
  trigger: string;
  input?: any | null;
  output?: string | null;
  trace?: any | null;
  error?: string | null;
  startedAt: string;
  completedAt?: string | null;
  durationMs?: number | null;
  tokenCount?: number | null;
  costUsd?: string | null;
  reportedToCore: boolean;
}

export interface ExecutionStats {
  overview: {
    total: number;
    successful: number;
    failed: number;
    running: number;
    successRate: number;
    totalCostUsd: string;
    averageDurationMs: number | null;
  };
  bySkill: Array<{
    skillId: string;
    skillName: string;
    count: number;
    successCount: number;
    avgDurationMs: number;
    totalCostUsd: string;
  }>;
  byDay: Array<{
    date: string;
    count: number;
    successful: number;
    failed: number;
  }>;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  description?: string | null;
  isActive: boolean;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApiKeyResponse {
  id: string;
  key: string;  // Full key - only shown once
  name: string;
  keyPrefix: string;
  description?: string | null;
  expiresAt?: string | null;
  isActive: boolean;
  createdAt: string;
  message?: string;
}
