/**
 * Alfred API Client - Wraps the Alfred REST API with type-safe methods
 */

import fetch from "node-fetch";
import type {
  AlfredApiResponse,
  Skill,
  Connection,
  Execution,
  ExecutionStats,
  ApiKey,
  CreateApiKeyResponse,
} from "./types.js";

export interface AlfredClientConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
}

export class AlfredClient {
  constructor(private config: AlfredClientConfig) {}

  private async request<T = any>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<AlfredApiResponse<T>> {
    const url = `${this.config.baseUrl}${path}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        method,
        headers: {
          "X-API-Key": this.config.apiKey,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json() as AlfredApiResponse<T>;

      if (!response.ok) {
        throw new Error(
          data.error || data.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeout}ms`);
      }
      throw error;
    }
  }

  // Skills API Methods
  async listSkills(params?: {
    isActive?: boolean;
    triggerType?: string;
    isSystem?: boolean;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<AlfredApiResponse<Skill[]>> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    const queryString = query.toString();
    return this.request<Skill[]>("GET", `/skills${queryString ? `?${queryString}` : ""}`);
  }

  async getSkill(id: string): Promise<AlfredApiResponse<Skill>> {
    return this.request<Skill>("GET", `/skills/${id}`);
  }

  async createSkill(data: Partial<Skill>): Promise<AlfredApiResponse<Skill>> {
    return this.request<Skill>("POST", "/skills", data);
  }

  async updateSkill(id: string, data: Partial<Skill>): Promise<AlfredApiResponse<Skill>> {
    return this.request<Skill>("PUT", `/skills/${id}`, data);
  }

  async patchSkill(id: string, data: Partial<Skill>): Promise<AlfredApiResponse<Skill>> {
    return this.request<Skill>("PATCH", `/skills/${id}`, data);
  }

  async deleteSkill(id: string, force?: boolean): Promise<AlfredApiResponse<Skill>> {
    const query = force ? "?force=true" : "";
    return this.request<Skill>("DELETE", `/skills/${id}${query}`);
  }

  // Connections API Methods
  async listConnections(params?: {
    isActive?: boolean;
    type?: string;
    source?: string;
    authStatus?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<AlfredApiResponse<Connection[]>> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    const queryString = query.toString();
    return this.request<Connection[]>("GET", `/connections${queryString ? `?${queryString}` : ""}`);
  }

  async getConnection(id: string): Promise<AlfredApiResponse<Connection>> {
    return this.request<Connection>("GET", `/connections/${id}`);
  }

  async createConnection(data: Partial<Connection>): Promise<AlfredApiResponse<Connection>> {
    return this.request<Connection>("POST", "/connections", data);
  }

  async updateConnection(id: string, data: Partial<Connection>): Promise<AlfredApiResponse<Connection>> {
    return this.request<Connection>("PUT", `/connections/${id}`, data);
  }

  async patchConnection(id: string, data: Partial<Connection>): Promise<AlfredApiResponse<Connection>> {
    return this.request<Connection>("PATCH", `/connections/${id}`, data);
  }

  async deleteConnection(id: string): Promise<AlfredApiResponse<Connection>> {
    return this.request<Connection>("DELETE", `/connections/${id}`);
  }

  // Executions API Methods
  async listExecutions(params?: {
    skillId?: string;
    status?: string;
    trigger?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<AlfredApiResponse<Execution[]>> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    const queryString = query.toString();
    return this.request<Execution[]>("GET", `/executions${queryString ? `?${queryString}` : ""}`);
  }

  async getExecution(id: string): Promise<AlfredApiResponse<Execution>> {
    return this.request<Execution>("GET", `/executions/${id}`);
  }

  async getExecutionTrace(id: string): Promise<AlfredApiResponse<any>> {
    return this.request<any>("GET", `/executions/${id}/trace`);
  }

  async getExecutionStats(params?: {
    startDate?: string;
    endDate?: string;
    skillId?: string;
  }): Promise<AlfredApiResponse<ExecutionStats>> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    const queryString = query.toString();
    return this.request<ExecutionStats>("GET", `/executions/stats${queryString ? `?${queryString}` : ""}`);
  }

  async deleteExecution(id: string): Promise<AlfredApiResponse<Execution>> {
    return this.request<Execution>("DELETE", `/executions/${id}`);
  }

  // Auth API Methods
  async createApiKey(data: {
    name: string;
    description?: string;
    expiresAt?: string;
  }): Promise<AlfredApiResponse<CreateApiKeyResponse>> {
    return this.request<CreateApiKeyResponse>("POST", "/auth/keys", data);
  }

  async listApiKeys(): Promise<AlfredApiResponse<ApiKey[]>> {
    return this.request<ApiKey[]>("GET", "/auth/keys");
  }

  async deleteApiKey(id: string): Promise<AlfredApiResponse<ApiKey>> {
    return this.request<ApiKey>("DELETE", `/auth/keys/${id}`);
  }
}
