/**
 * Shared Trace Store with Vercel KV Persistence
 *
 * Uses Vercel KV (Redis) for production persistence.
 * Falls back to in-memory storage for local development.
 */

import { kv } from '@vercel/kv';

export interface LLMData {
  vendor: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  input?: string;
  output?: string;
  context?: string | string[];  // Source context/retrieved chunks for document extraction
  temperature?: number;
}

export interface CERTTrace {
  id: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: string;
  startTime: string;
  endTime: string;
  durationMs: number;
  status: 'ok' | 'error' | 'unset';
  attributes: Record<string, unknown>;
  llm?: LLMData;
  evaluation?: {
    score?: number;
    status?: 'pass' | 'fail' | 'review';
    criteria?: Record<string, number>;
    judgeModel?: string;
    evaluatedAt?: string;
  };
  receivedAt: string;
  source: 'otlp' | 'sdk' | 'manual';
}

// KV Keys
const TRACES_KEY = 'cert:traces';
const TRACES_LIST_KEY = 'cert:traces:list';
const MAX_TRACES = 1000;

// In-memory fallback for local development
let memoryTraces: CERTTrace[] = [];

// Check if KV is configured
function isKVConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/**
 * Add a single trace
 */
export async function addTrace(trace: CERTTrace): Promise<void> {
  if (isKVConfigured()) {
    try {
      // Store trace by ID
      await kv.set(`${TRACES_KEY}:${trace.id}`, trace, { ex: 86400 * 30 }); // 30 day TTL

      // Add to list (prepend)
      await kv.lpush(TRACES_LIST_KEY, trace.id);

      // Trim list to max size
      await kv.ltrim(TRACES_LIST_KEY, 0, MAX_TRACES - 1);
    } catch (error) {
      console.error('[CERT KV] Error adding trace:', error);
      // Fallback to memory
      memoryTraces.unshift(trace);
      if (memoryTraces.length > MAX_TRACES) memoryTraces.pop();
    }
  } else {
    memoryTraces.unshift(trace);
    if (memoryTraces.length > MAX_TRACES) memoryTraces.pop();
  }
}

/**
 * Add multiple traces
 */
export async function addTraces(traces: CERTTrace[]): Promise<void> {
  for (const trace of traces) {
    await addTrace(trace);
  }
}

/**
 * Get traces with filtering
 */
export async function getTraces(options?: {
  limit?: number;
  offset?: number;
  llmOnly?: boolean;
  model?: string;
  status?: string;
  vendor?: string;
}): Promise<CERTTrace[]> {
  let traces: CERTTrace[] = [];

  if (isKVConfigured()) {
    try {
      // Get trace IDs from list
      const ids = await kv.lrange(TRACES_LIST_KEY, 0, MAX_TRACES - 1);

      if (ids && ids.length > 0) {
        // Get all traces by ID
        const tracePromises = ids.map(id => kv.get<CERTTrace>(`${TRACES_KEY}:${id}`));
        const results = await Promise.all(tracePromises);
        traces = results.filter((t): t is CERTTrace => t !== null);
      }
    } catch (error) {
      console.error('[CERT KV] Error getting traces:', error);
      traces = [...memoryTraces];
    }
  } else {
    traces = [...memoryTraces];
  }

  // Apply filters
  if (options?.llmOnly) {
    traces = traces.filter(t => t.llm);
  }

  if (options?.model) {
    traces = traces.filter(t => t.llm?.model?.includes(options.model!));
  }

  if (options?.vendor) {
    traces = traces.filter(t => t.llm?.vendor === options.vendor);
  }

  if (options?.status) {
    traces = traces.filter(t => t.evaluation?.status === options.status);
  }

  // Paginate
  const offset = options?.offset || 0;
  const limit = options?.limit || 100;

  return traces.slice(offset, offset + limit);
}

/**
 * Get LLM traces only
 */
export async function getLLMTraces(): Promise<CERTTrace[]> {
  const traces = await getTraces({ llmOnly: true, limit: MAX_TRACES });
  return traces;
}

/**
 * Get statistics
 */
export async function getStats(): Promise<{
  total: number;
  llmTraces: number;
  evaluated: number;
  byStatus: { pass: number; fail: number; review: number };
  byVendor: Record<string, number>;
  byModel: Record<string, number>;
  totalTokens: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
}> {
  const traces = await getTraces({ limit: MAX_TRACES });
  const llmTraces = traces.filter(t => t.llm);

  return {
    total: traces.length,
    llmTraces: llmTraces.length,
    evaluated: traces.filter(t => t.evaluation).length,
    byStatus: {
      pass: traces.filter(t => t.evaluation?.status === 'pass').length,
      fail: traces.filter(t => t.evaluation?.status === 'fail').length,
      review: traces.filter(t => t.evaluation?.status === 'review').length,
    },
    byVendor: llmTraces.reduce((acc, t) => {
      const vendor = t.llm?.vendor || 'unknown';
      acc[vendor] = (acc[vendor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byModel: llmTraces.reduce((acc, t) => {
      const model = t.llm?.model || 'unknown';
      acc[model] = (acc[model] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    totalTokens: llmTraces.reduce((acc, t) => acc + (t.llm?.totalTokens || 0), 0),
    totalPromptTokens: llmTraces.reduce((acc, t) => acc + (t.llm?.promptTokens || 0), 0),
    totalCompletionTokens: llmTraces.reduce((acc, t) => acc + (t.llm?.completionTokens || 0), 0),
  };
}

/**
 * Get performance metrics
 */
export async function getPerformanceMetrics(): Promise<{
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  throughput: number;
  totalCalls: number;
  latencyByModel: Array<{ model: string; p50: number; p95: number; calls: number }>;
  latencyTrend: Array<{ date: string; p50: number; p95: number }>;
} | null> {
  const llmTraces = await getLLMTraces();

  if (llmTraces.length === 0) {
    return null;
  }

  const latencies = llmTraces
    .map(t => t.durationMs)
    .filter(d => d > 0)
    .sort((a, b) => a - b);

  if (latencies.length === 0) {
    return null;
  }

  const p50Index = Math.floor(latencies.length * 0.5);
  const p95Index = Math.floor(latencies.length * 0.95);
  const p99Index = Math.floor(latencies.length * 0.99);

  // Group by model
  const byModel: Record<string, { latencies: number[]; calls: number }> = {};
  for (const trace of llmTraces) {
    const model = trace.llm?.model || 'unknown';
    if (!byModel[model]) {
      byModel[model] = { latencies: [], calls: 0 };
    }
    byModel[model].latencies.push(trace.durationMs);
    byModel[model].calls++;
  }

  const latencyByModel = Object.entries(byModel).map(([model, data]) => {
    const sorted = data.latencies.sort((a, b) => a - b);
    return {
      model,
      p50: sorted[Math.floor(sorted.length * 0.5)] || 0,
      p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
      calls: data.calls,
    };
  });

  // Throughput (requests in last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentTraces = llmTraces.filter(t => new Date(t.receivedAt) >= oneHourAgo);

  // Latency trend by day
  const byDate: Record<string, number[]> = {};
  for (const trace of llmTraces) {
    const date = new Date(trace.receivedAt).toISOString().split('T')[0];
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(trace.durationMs);
  }

  const latencyTrend = Object.entries(byDate)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7)
    .map(([date, lats]) => {
      const sorted = lats.sort((a, b) => a - b);
      return {
        date: date.slice(5),
        p50: sorted[Math.floor(sorted.length * 0.5)] || 0,
        p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
      };
    });

  return {
    p50Latency: latencies[p50Index] || 0,
    p95Latency: latencies[p95Index] || 0,
    p99Latency: latencies[p99Index] || 0,
    throughput: recentTraces.length,
    totalCalls: llmTraces.length,
    latencyByModel,
    latencyTrend,
  };
}

/**
 * Get cost metrics
 */
export async function getCostMetrics(): Promise<{
  totalCost: number;
  byModel: Record<string, number>;
  byPlatform: Record<string, number>;
  dailyCosts: Record<string, number>;
  projectedMonthlyCost: number;
  avgCostPerQuery: number;
} | null> {
  const llmTraces = await getLLMTraces();

  if (llmTraces.length === 0) {
    return null;
  }

  // Pricing per 1M tokens
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 5, output: 15 },
    'gpt-4o-mini': { input: 0.15, output: 0.6 },
    'gpt-4-turbo': { input: 10, output: 30 },
    'gpt-4': { input: 30, output: 60 },
    'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
    'claude-3-opus': { input: 15, output: 75 },
    'claude-3-sonnet': { input: 3, output: 15 },
    'claude-sonnet-4-5': { input: 3, output: 15 },
    'claude-3-haiku': { input: 0.25, output: 1.25 },
    'gemini-pro': { input: 0.5, output: 1.5 },
    'gemini-1.5-pro': { input: 3.5, output: 10.5 },
  };

  let totalCost = 0;
  const byModel: Record<string, number> = {};
  const byPlatform: Record<string, number> = {};
  const dailyCosts: Record<string, number> = {};

  for (const trace of llmTraces) {
    const model = trace.llm?.model || 'unknown';
    const vendor = trace.llm?.vendor || 'unknown';
    const promptTokens = trace.llm?.promptTokens || 0;
    const completionTokens = trace.llm?.completionTokens || 0;

    // Find matching pricing
    let modelPricing = { input: 1, output: 2 };
    for (const [key, value] of Object.entries(pricing)) {
      if (model.toLowerCase().includes(key.toLowerCase())) {
        modelPricing = value;
        break;
      }
    }

    const cost = (promptTokens * modelPricing.input + completionTokens * modelPricing.output) / 1_000_000;
    totalCost += cost;

    byModel[model] = (byModel[model] || 0) + cost;
    byPlatform[vendor] = (byPlatform[vendor] || 0) + cost;

    const date = new Date(trace.receivedAt).toISOString().split('T')[0];
    dailyCosts[date] = (dailyCosts[date] || 0) + cost;
  }

  const days = Object.keys(dailyCosts).length || 1;
  const dailyAvg = totalCost / days;

  return {
    totalCost,
    byModel,
    byPlatform,
    dailyCosts,
    projectedMonthlyCost: dailyAvg * 30,
    avgCostPerQuery: totalCost / llmTraces.length,
  };
}

/**
 * Get quality metrics
 */
export async function getQualityMetrics(): Promise<{
  passRate: number;
  passRateTrend: number;
  tracesEvaluated: number;
  pendingReview: number;
  criteriaScores: {
    accuracy: number;
    relevance: number;
    safety: number;
    coherence: number;
  };
  recentEvaluations: Array<{
    id: string;
    time: string;
    model: string;
    score: number;
    status: 'pass' | 'fail' | 'review';
  }>;
}> {
  const traces = await getTraces({ limit: MAX_TRACES });
  const llmTraces = traces.filter(t => t.llm);
  const evaluatedTraces = traces.filter(t => t.evaluation);

  if (evaluatedTraces.length === 0) {
    return {
      passRate: 0,
      passRateTrend: 0,
      tracesEvaluated: 0,
      pendingReview: llmTraces.length,
      criteriaScores: { accuracy: 0, relevance: 0, safety: 0, coherence: 0 },
      recentEvaluations: [],
    };
  }

  const passed = evaluatedTraces.filter(t => t.evaluation?.status === 'pass').length;
  const passRate = (passed / evaluatedTraces.length) * 100;

  const criteriaScores = { accuracy: 0, relevance: 0, safety: 0, coherence: 0 };
  let criteriaCount = 0;

  for (const trace of evaluatedTraces) {
    if (trace.evaluation?.criteria) {
      criteriaScores.accuracy += trace.evaluation.criteria.accuracy || 0;
      criteriaScores.relevance += trace.evaluation.criteria.relevance || 0;
      criteriaScores.safety += trace.evaluation.criteria.safety || 0;
      criteriaScores.coherence += trace.evaluation.criteria.coherence || 0;
      criteriaCount++;
    }
  }

  if (criteriaCount > 0) {
    criteriaScores.accuracy = Math.round((criteriaScores.accuracy / criteriaCount) * 100);
    criteriaScores.relevance = Math.round((criteriaScores.relevance / criteriaCount) * 100);
    criteriaScores.safety = Math.round((criteriaScores.safety / criteriaCount) * 100);
    criteriaScores.coherence = Math.round((criteriaScores.coherence / criteriaCount) * 100);
  }

  const recentEvaluations = evaluatedTraces.slice(0, 10).map(t => ({
    id: t.id,
    time: new Date(t.evaluation?.evaluatedAt || t.receivedAt).toLocaleString(),
    model: t.llm?.model || 'unknown',
    score: t.evaluation?.score || 0,
    status: t.evaluation?.status || 'review' as const,
  }));

  return {
    passRate,
    passRateTrend: 0,
    tracesEvaluated: evaluatedTraces.length,
    pendingReview: llmTraces.length - evaluatedTraces.length,
    criteriaScores,
    recentEvaluations,
  };
}

/**
 * Update evaluation for a trace
 */
export async function updateEvaluation(
  traceId: string,
  evaluation: CERTTrace['evaluation']
): Promise<boolean> {
  if (isKVConfigured()) {
    try {
      const trace = await kv.get<CERTTrace>(`${TRACES_KEY}:${traceId}`);
      if (trace) {
        trace.evaluation = evaluation;
        await kv.set(`${TRACES_KEY}:${traceId}`, trace, { ex: 86400 * 30 });
        return true;
      }
    } catch (error) {
      console.error('[CERT KV] Error updating evaluation:', error);
    }
  }

  const trace = memoryTraces.find(t => t.id === traceId || t.traceId === traceId);
  if (trace) {
    trace.evaluation = evaluation;
    return true;
  }
  return false;
}

/**
 * Clear all traces
 */
export async function clearTraces(): Promise<number> {
  let count = 0;

  if (isKVConfigured()) {
    try {
      const ids = await kv.lrange(TRACES_LIST_KEY, 0, -1);
      count = ids?.length || 0;

      // Delete all trace keys
      if (ids && ids.length > 0) {
        const deletePromises = ids.map(id => kv.del(`${TRACES_KEY}:${id}`));
        await Promise.all(deletePromises);
      }

      // Clear the list
      await kv.del(TRACES_LIST_KEY);
    } catch (error) {
      console.error('[CERT KV] Error clearing traces:', error);
    }
  }

  count = Math.max(count, memoryTraces.length);
  memoryTraces = [];

  return count;
}

/**
 * Get trace count
 */
export async function getTraceCount(): Promise<number> {
  if (isKVConfigured()) {
    try {
      const len = await kv.llen(TRACES_LIST_KEY);
      return len || 0;
    } catch (error) {
      console.error('[CERT KV] Error getting count:', error);
    }
  }
  return memoryTraces.length;
}

// Legacy class-based interface for backwards compatibility
export const traceStore = {
  addTrace,
  addTraces,
  getTraces,
  getLLMTraces,
  getStats,
  getPerformanceMetrics,
  getCostMetrics,
  getQualityMetrics,
  updateEvaluation,
  clear: clearTraces,
  getCount: getTraceCount,
};
