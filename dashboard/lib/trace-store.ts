/**
 * Shared Trace Store
 *
 * Central storage for LLM traces received from applications.
 * In production, this should be backed by a database (Vercel KV, Postgres, etc.)
 * For development, uses in-memory storage.
 */

export interface LLMData {
  vendor: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  input?: string;
  output?: string;
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

// In-memory store (for development)
// In production, replace with database calls
class TraceStore {
  private traces: CERTTrace[] = [];
  private maxTraces = 1000;

  addTrace(trace: CERTTrace): void {
    this.traces.unshift(trace);
    if (this.traces.length > this.maxTraces) {
      this.traces.pop();
    }
  }

  addTraces(traces: CERTTrace[]): void {
    for (const trace of traces) {
      this.addTrace(trace);
    }
  }

  getTraces(options?: {
    limit?: number;
    offset?: number;
    llmOnly?: boolean;
    model?: string;
    status?: string;
    vendor?: string;
    since?: Date;
  }): CERTTrace[] {
    let filtered = [...this.traces];

    if (options?.llmOnly) {
      filtered = filtered.filter(t => t.llm);
    }

    if (options?.model) {
      filtered = filtered.filter(t => t.llm?.model?.includes(options.model!));
    }

    if (options?.vendor) {
      filtered = filtered.filter(t => t.llm?.vendor === options.vendor);
    }

    if (options?.status) {
      filtered = filtered.filter(t => t.evaluation?.status === options.status);
    }

    if (options?.since) {
      filtered = filtered.filter(t => new Date(t.receivedAt) >= options.since!);
    }

    const offset = options?.offset || 0;
    const limit = options?.limit || 100;

    return filtered.slice(offset, offset + limit);
  }

  getLLMTraces(): CERTTrace[] {
    return this.traces.filter(t => t.llm);
  }

  getStats() {
    const llmTraces = this.getLLMTraces();

    return {
      total: this.traces.length,
      llmTraces: llmTraces.length,
      evaluated: this.traces.filter(t => t.evaluation).length,
      byStatus: {
        pass: this.traces.filter(t => t.evaluation?.status === 'pass').length,
        fail: this.traces.filter(t => t.evaluation?.status === 'fail').length,
        review: this.traces.filter(t => t.evaluation?.status === 'review').length,
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

  getPerformanceMetrics() {
    const llmTraces = this.getLLMTraces();
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

    // Calculate hourly throughput (requests in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTraces = llmTraces.filter(t => new Date(t.receivedAt) >= oneHourAgo);

    return {
      p50Latency: latencies[p50Index] || 0,
      p95Latency: latencies[p95Index] || 0,
      p99Latency: latencies[p99Index] || 0,
      throughput: recentTraces.length,
      totalCalls: llmTraces.length,
      latencyByModel,
      latencyTrend: this.getLatencyTrend(),
    };
  }

  private getLatencyTrend() {
    const llmTraces = this.getLLMTraces();
    const byDate: Record<string, number[]> = {};

    for (const trace of llmTraces) {
      const date = new Date(trace.receivedAt).toISOString().split('T')[0];
      if (!byDate[date]) {
        byDate[date] = [];
      }
      byDate[date].push(trace.durationMs);
    }

    return Object.entries(byDate)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7)
      .map(([date, latencies]) => {
        const sorted = latencies.sort((a, b) => a - b);
        return {
          date: date.slice(5), // MM-DD
          p50: sorted[Math.floor(sorted.length * 0.5)] || 0,
          p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
        };
      });
  }

  getCostMetrics() {
    const llmTraces = this.getLLMTraces();
    if (llmTraces.length === 0) {
      return null;
    }

    // Pricing per 1M tokens (approximate)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 5, output: 15 },
      'gpt-4o-mini': { input: 0.15, output: 0.6 },
      'gpt-4-turbo': { input: 10, output: 30 },
      'gpt-4': { input: 30, output: 60 },
      'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
      'claude-3-opus': { input: 15, output: 75 },
      'claude-3-sonnet': { input: 3, output: 15 },
      'claude-sonnet-4-5-20250929': { input: 3, output: 15 },
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

      // Find matching pricing (partial match)
      let modelPricing = { input: 1, output: 2 }; // default
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

    // Project monthly cost based on daily average
    const days = Object.keys(dailyCosts).length || 1;
    const dailyAvg = totalCost / days;
    const projectedMonthlyCost = dailyAvg * 30;

    return {
      totalCost,
      byModel,
      byPlatform,
      dailyCosts,
      projectedMonthlyCost,
      avgCostPerQuery: totalCost / llmTraces.length,
    };
  }

  getQualityMetrics() {
    const llmTraces = this.getLLMTraces();
    const evaluatedTraces = this.traces.filter(t => t.evaluation);

    if (evaluatedTraces.length === 0) {
      return {
        passRate: 0,
        passRateTrend: 0,
        tracesEvaluated: 0,
        pendingReview: llmTraces.length, // All traces need evaluation
        criteriaScores: {
          accuracy: 0,
          relevance: 0,
          safety: 0,
          coherence: 0,
        },
        recentEvaluations: [],
      };
    }

    const passed = evaluatedTraces.filter(t => t.evaluation?.status === 'pass').length;
    const passRate = (passed / evaluatedTraces.length) * 100;

    // Calculate criteria averages
    const criteriaScores = {
      accuracy: 0,
      relevance: 0,
      safety: 0,
      coherence: 0,
    };

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

    // Recent evaluations
    const recentEvaluations = evaluatedTraces.slice(0, 10).map(t => ({
      id: t.id,
      time: new Date(t.evaluation?.evaluatedAt || t.receivedAt).toLocaleString(),
      model: t.llm?.model || 'unknown',
      score: t.evaluation?.score || 0,
      status: t.evaluation?.status || 'review',
    }));

    return {
      passRate,
      passRateTrend: 0, // Would need historical data
      tracesEvaluated: evaluatedTraces.length,
      pendingReview: llmTraces.length - evaluatedTraces.length,
      criteriaScores,
      recentEvaluations,
    };
  }

  updateEvaluation(traceId: string, evaluation: CERTTrace['evaluation']): boolean {
    const trace = this.traces.find(t => t.id === traceId || t.traceId === traceId);
    if (trace) {
      trace.evaluation = evaluation;
      return true;
    }
    return false;
  }

  clear(): number {
    const count = this.traces.length;
    this.traces = [];
    return count;
  }

  getCount(): number {
    return this.traces.length;
  }
}

// Singleton instance
export const traceStore = new TraceStore();
