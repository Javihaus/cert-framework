/**
 * Supabase Client for CERT Dashboard
 *
 * Provides database access for user authentication and trace storage.
 * Falls back gracefully when Supabase is not configured.
 */

// Types for our database tables
export interface User {
  id: string;
  created_at: string;
  updated_at: string;
  email: string;
  name: string;
  company?: string;
  password_hash: string;
  is_active: boolean;
  email_verified: boolean;
  api_key: string;
  settings: Record<string, unknown>;
}

export interface Session {
  id: string;
  user_id: string;
  created_at: string;
  expires_at: string;
  token: string;
  user_agent?: string;
  ip_address?: string;
}

export interface Project {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  name: string;
  description?: string;
  version: string;
}

export interface DBTrace {
  id: string;
  created_at: string;
  user_id: string;
  project_id?: string;
  trace_id?: string;
  span_id?: string;
  parent_span_id?: string;
  name: string;
  kind: string;
  vendor?: string;
  model?: string;
  input_text?: string;
  output_text?: string;
  context?: string[];
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  duration_ms: number;
  start_time?: string;
  end_time?: string;
  status: 'ok' | 'error' | 'unset';
  error_message?: string;
  evaluation_score?: number;
  evaluation_status?: 'pass' | 'fail' | 'review';
  evaluation_criteria?: Record<string, number>;
  evaluated_at?: string;
  evaluated_by?: string;
  metadata: Record<string, unknown>;
  source: 'otlp' | 'sdk' | 'manual';
}

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_KEY);
}

// Generic Supabase REST API client
class SupabaseClient {
  private url: string;
  private key: string;

  constructor() {
    this.url = process.env.SUPABASE_URL || '';
    this.key = process.env.SUPABASE_KEY || '';
  }

  private async request<T>(
    table: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    options: {
      select?: string;
      filter?: Record<string, string>;
      body?: Record<string, unknown> | Record<string, unknown>[];
      single?: boolean;
      order?: { column: string; ascending?: boolean };
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<T> {
    if (!this.url || !this.key) {
      throw new Error('Supabase not configured');
    }

    let url = `${this.url}/rest/v1/${table}`;
    const params = new URLSearchParams();

    if (options.select) {
      params.set('select', options.select);
    }

    if (options.filter) {
      for (const [key, value] of Object.entries(options.filter)) {
        params.set(key, value);
      }
    }

    if (options.order) {
      params.set('order', `${options.order.column}.${options.order.ascending ? 'asc' : 'desc'}`);
    }

    if (options.limit) {
      params.set('limit', options.limit.toString());
    }

    if (options.offset) {
      params.set('offset', options.offset.toString());
    }

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const headers: Record<string, string> = {
      'apikey': this.key,
      'Authorization': `Bearer ${this.key}`,
      'Content-Type': 'application/json',
    };

    if (options.single) {
      headers['Accept'] = 'application/vnd.pgrst.object+json';
    }

    if (method === 'POST' && !options.single) {
      headers['Prefer'] = 'return=representation';
    }

    const response = await fetch(url, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase error: ${response.status} - ${error}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // User operations
  async createUser(data: {
    email: string;
    name: string;
    company?: string;
    password_hash: string;
  }): Promise<User> {
    const result = await this.request<User[]>('users', 'POST', {
      body: data,
      select: '*',
    });
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      return await this.request<User>('users', 'GET', {
        filter: { email: `eq.${email}` },
        single: true,
      });
    } catch {
      return null;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      return await this.request<User>('users', 'GET', {
        filter: { id: `eq.${id}` },
        single: true,
      });
    } catch {
      return null;
    }
  }

  async getUserByApiKey(apiKey: string): Promise<User | null> {
    try {
      return await this.request<User>('users', 'GET', {
        filter: { api_key: `eq.${apiKey}` },
        single: true,
      });
    } catch {
      return null;
    }
  }

  // Session operations
  async createSession(data: {
    user_id: string;
    token: string;
    expires_at: string;
    user_agent?: string;
    ip_address?: string;
  }): Promise<Session> {
    const result = await this.request<Session[]>('sessions', 'POST', {
      body: data,
      select: '*',
    });
    return result[0];
  }

  async getSessionByToken(token: string): Promise<Session | null> {
    try {
      return await this.request<Session>('sessions', 'GET', {
        filter: {
          token: `eq.${token}`,
          expires_at: `gt.${new Date().toISOString()}`,
        },
        single: true,
      });
    } catch {
      return null;
    }
  }

  async deleteSession(token: string): Promise<void> {
    await this.request<void>('sessions', 'DELETE', {
      filter: { token: `eq.${token}` },
    });
  }

  async deleteUserSessions(userId: string): Promise<void> {
    await this.request<void>('sessions', 'DELETE', {
      filter: { user_id: `eq.${userId}` },
    });
  }

  // Project operations
  async createProject(data: {
    user_id: string;
    name: string;
    description?: string;
  }): Promise<Project> {
    const result = await this.request<Project[]>('projects', 'POST', {
      body: data,
      select: '*',
    });
    return result[0];
  }

  async getProjectsByUser(userId: string): Promise<Project[]> {
    return this.request<Project[]>('projects', 'GET', {
      filter: { user_id: `eq.${userId}` },
      order: { column: 'created_at', ascending: false },
    });
  }

  async getProjectByName(userId: string, name: string): Promise<Project | null> {
    try {
      return await this.request<Project>('projects', 'GET', {
        filter: {
          user_id: `eq.${userId}`,
          name: `eq.${name}`,
        },
        single: true,
      });
    } catch {
      return null;
    }
  }

  // Trace operations
  async insertTrace(data: Partial<DBTrace> & { user_id: string; name: string }): Promise<DBTrace> {
    const result = await this.request<DBTrace[]>('traces', 'POST', {
      body: data,
      select: '*',
    });
    return result[0];
  }

  async insertTraces(traces: Array<Partial<DBTrace> & { user_id: string; name: string }>): Promise<DBTrace[]> {
    return this.request<DBTrace[]>('traces', 'POST', {
      body: traces,
      select: '*',
    });
  }

  async getTraces(options: {
    userId: string;
    projectId?: string;
    limit?: number;
    offset?: number;
    model?: string;
    vendor?: string;
    status?: string;
    evaluationStatus?: string;
  }): Promise<DBTrace[]> {
    const filter: Record<string, string> = {
      user_id: `eq.${options.userId}`,
    };

    if (options.projectId) {
      filter.project_id = `eq.${options.projectId}`;
    }

    if (options.model) {
      filter.model = `ilike.*${options.model}*`;
    }

    if (options.vendor) {
      filter.vendor = `eq.${options.vendor}`;
    }

    if (options.status) {
      filter.status = `eq.${options.status}`;
    }

    if (options.evaluationStatus) {
      filter.evaluation_status = `eq.${options.evaluationStatus}`;
    }

    return this.request<DBTrace[]>('traces', 'GET', {
      filter,
      order: { column: 'created_at', ascending: false },
      limit: options.limit || 100,
      offset: options.offset || 0,
    });
  }

  async getTraceCount(userId: string, projectId?: string): Promise<number> {
    const filter: Record<string, string> = {
      user_id: `eq.${userId}`,
    };
    if (projectId) {
      filter.project_id = `eq.${projectId}`;
    }

    const result = await this.request<Array<{ count: number }>>('traces', 'GET', {
      filter,
      select: 'count',
    });

    return result.length;
  }

  async updateTraceEvaluation(
    traceId: string,
    userId: string,
    evaluation: {
      evaluation_score?: number;
      evaluation_status?: 'pass' | 'fail' | 'review';
      evaluation_criteria?: Record<string, number>;
      evaluated_by?: string;
    }
  ): Promise<void> {
    await this.request<void>('traces', 'PATCH', {
      filter: {
        id: `eq.${traceId}`,
        user_id: `eq.${userId}`,
      },
      body: {
        ...evaluation,
        evaluated_at: new Date().toISOString(),
      },
    });
  }

  async deleteTraces(userId: string, projectId?: string): Promise<void> {
    const filter: Record<string, string> = {
      user_id: `eq.${userId}`,
    };
    if (projectId) {
      filter.project_id = `eq.${projectId}`;
    }

    await this.request<void>('traces', 'DELETE', { filter });
  }

  // Stats
  async getTraceStats(userId: string): Promise<{
    total: number;
    byVendor: Record<string, number>;
    byModel: Record<string, number>;
    byStatus: { pass: number; fail: number; review: number; pending: number };
    totalTokens: number;
  }> {
    const traces = await this.getTraces({ userId, limit: 10000 });

    const byVendor: Record<string, number> = {};
    const byModel: Record<string, number> = {};
    let totalTokens = 0;
    let pass = 0, fail = 0, review = 0, pending = 0;

    for (const trace of traces) {
      if (trace.vendor) {
        byVendor[trace.vendor] = (byVendor[trace.vendor] || 0) + 1;
      }
      if (trace.model) {
        byModel[trace.model] = (byModel[trace.model] || 0) + 1;
      }
      totalTokens += trace.total_tokens || 0;

      switch (trace.evaluation_status) {
        case 'pass': pass++; break;
        case 'fail': fail++; break;
        case 'review': review++; break;
        default: pending++; break;
      }
    }

    return {
      total: traces.length,
      byVendor,
      byModel,
      byStatus: { pass, fail, review, pending },
      totalTokens,
    };
  }
}

// Singleton instance
let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = new SupabaseClient();
  }
  return supabaseInstance;
}

// Simple password hashing (in production, use bcrypt)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + (process.env.PASSWORD_SALT || 'cert-salt'));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Generate session token
export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}
