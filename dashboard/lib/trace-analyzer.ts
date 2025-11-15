/**
 * CERT Framework Trace Analyzer
 * Pure TypeScript logic for analyzing trace data - no React dependencies
 */

import { Trace, CostSummary, OptimizationOpportunity } from '@/types/trace';

export class TraceAnalyzer {
  private traces: Trace[];

  constructor(traces: Trace[]) {
    this.traces = traces;
  }

  /**
   * Calculate comprehensive cost summary
   */
  calculateCosts(): CostSummary {
    const totalCost = this.traces.reduce((sum, t) => sum + (t.cost || 0), 0);

    // Daily cost breakdown
    const dailyCosts: Record<string, number> = {};
    this.traces.forEach(t => {
      const date = t.timestamp.split('T')[0];
      dailyCosts[date] = (dailyCosts[date] || 0) + (t.cost || 0);
    });

    // Cost by model
    const byModel: Record<string, number> = {};
    this.traces.forEach(t => {
      byModel[t.model] = (byModel[t.model] || 0) + (t.cost || 0);
    });

    // Cost by platform
    const byPlatform: Record<string, number> = {};
    this.traces.forEach(t => {
      byPlatform[t.platform] = (byPlatform[t.platform] || 0) + (t.cost || 0);
    });

    // Calculate average per successful task
    const successful = this.traces.filter(t => (t.confidence || 0) >= 0.7).length;
    const avgPerTask = successful > 0 ? totalCost / successful : totalCost / Math.max(1, this.traces.length);

    // Project monthly cost based on recent trend
    const projectedMonthlyCost = this.projectMonthlyCost(dailyCosts);

    return {
      totalCost,
      dailyCosts,
      byModel,
      byPlatform,
      avgPerTask,
      projectedMonthlyCost
    };
  }

  /**
   * Find optimization opportunities
   */
  findOptimizations(): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];

    // 1. Model downgrade opportunities
    opportunities.push(...this.findModelDowngradeOpportunities());

    // 2. Caching opportunities
    opportunities.push(...this.findCachingOpportunities());

    // 3. Prompt optimization opportunities
    opportunities.push(...this.findPromptOptimizationOpportunities());

    // 4. Batch processing opportunities
    opportunities.push(...this.findBatchProcessingOpportunities());

    // Sort by potential savings (descending)
    return opportunities.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }

  /**
   * Find opportunities to downgrade to cheaper models
   */
  private findModelDowngradeOpportunities(): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];
    const byModel = this.groupBy(this.traces, 'model');

    // Model cost hierarchy (expensive -> cheap)
    const downgrades: Record<string, { cheaper: string; savingsRate: number }> = {
      'gpt-4': { cheaper: 'gpt-4-turbo', savingsRate: 0.67 },
      'gpt-4-turbo': { cheaper: 'gpt-3.5-turbo', savingsRate: 0.95 },
      'claude-3-opus': { cheaper: 'claude-3-sonnet', savingsRate: 0.80 },
      'claude-3-sonnet': { cheaper: 'claude-3-haiku', savingsRate: 0.95 },
    };

    for (const [model, traces] of Object.entries(byModel)) {
      const avgConfidence = this.mean(traces.map(t => t.confidence || 0));
      const totalCost = traces.reduce((sum, t) => sum + (t.cost || 0), 0);

      // Only suggest downgrade if confidence is high
      if (avgConfidence > 0.85) {
        for (const [expensiveModel, { cheaper, savingsRate }] of Object.entries(downgrades)) {
          if (model.includes(expensiveModel)) {
            opportunities.push({
              type: 'model_downgrade',
              description: `Tasks using ${model} have ${(avgConfidence * 100).toFixed(1)}% avg confidence. Consider switching to ${cheaper}.`,
              currentCost: totalCost,
              potentialSavings: totalCost * savingsRate,
              confidence: avgConfidence > 0.9 ? 0.9 : 0.7,
              impact: totalCost > 50 ? 'high' : totalCost > 10 ? 'medium' : 'low',
              details: `${traces.length} calls analyzed`
            });
            break;
          }
        }
      }
    }

    return opportunities;
  }

  /**
   * Find opportunities to cache repeated prompts
   */
  private findCachingOpportunities(): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];

    // Count identical prompts
    const promptCounts = this.countBy(this.traces, t =>
      this.normalizePrompt(t.input_data)
    );

    for (const [prompt, count] of Object.entries(promptCounts)) {
      if (count >= 5) {
        const matchingTraces = this.traces.filter(t =>
          this.normalizePrompt(t.input_data) === prompt
        );
        const totalCost = matchingTraces.reduce((sum, t) => sum + (t.cost || 0), 0);

        // After first call, subsequent calls cost ~0 with caching
        const savings = totalCost * ((count - 1) / count);

        opportunities.push({
          type: 'caching',
          description: `Prompt repeated ${count} times: "${this.truncate(prompt, 60)}"`,
          currentCost: totalCost,
          potentialSavings: savings,
          confidence: 1.0,
          impact: savings > 10 ? 'high' : savings > 2 ? 'medium' : 'low',
          details: `Implement semantic caching or exact match caching`
        });
      }
    }

    return opportunities;
  }

  /**
   * Find opportunities to optimize prompt length
   */
  private findPromptOptimizationOpportunities(): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];

    // Find traces with large token counts
    const largePrompts = this.traces.filter(t =>
      (t.metadata?.tokens?.prompt || 0) > 2000
    );

    if (largePrompts.length > 0) {
      const totalCost = largePrompts.reduce((sum, t) => sum + (t.cost || 0), 0);
      const avgTokens = this.mean(largePrompts.map(t => t.metadata?.tokens?.prompt || 0));

      // Assume 30% reduction possible through prompt engineering
      const savings = totalCost * 0.3;

      opportunities.push({
        type: 'prompt_optimization',
        description: `${largePrompts.length} calls with avg ${avgTokens.toFixed(0)} input tokens. Optimize prompts to reduce token usage.`,
        currentCost: totalCost,
        potentialSavings: savings,
        confidence: 0.6,
        impact: savings > 20 ? 'high' : savings > 5 ? 'medium' : 'low',
        details: `Use prompt compression, remove redundancy, use system messages effectively`
      });
    }

    return opportunities;
  }

  /**
   * Find opportunities to batch API calls
   */
  private findBatchProcessingOpportunities(): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];

    // Group traces by time windows (1 minute)
    const timeWindows: Record<string, Trace[]> = {};
    this.traces.forEach(t => {
      const timestamp = new Date(t.timestamp);
      const windowKey = `${timestamp.toISOString().slice(0, 16)}`;
      if (!timeWindows[windowKey]) timeWindows[windowKey] = [];
      timeWindows[windowKey].push(t);
    });

    // Find windows with many similar calls
    for (const [window, traces] of Object.entries(timeWindows)) {
      if (traces.length >= 10) {
        const samePlatform = this.groupBy(traces, 'platform');
        for (const [platform, platformTraces] of Object.entries(samePlatform)) {
          if (platformTraces.length >= 10) {
            const totalCost = platformTraces.reduce((sum, t) => sum + (t.cost || 0), 0);
            // Batching can reduce costs by ~20% through reduced overhead
            const savings = totalCost * 0.2;

            opportunities.push({
              type: 'batch_processing',
              description: `${platformTraces.length} ${platform} calls in rapid succession. Consider batching.`,
              currentCost: totalCost,
              potentialSavings: savings,
              confidence: 0.7,
              impact: savings > 5 ? 'medium' : 'low',
              details: `Implement request batching to reduce API overhead`
            });
            break; // Only report once per window
          }
        }
      }
    }

    return opportunities;
  }

  /**
   * Project monthly cost based on recent trend
   */
  private projectMonthlyCost(dailyCosts: Record<string, number>): number {
    const costs = Object.values(dailyCosts);
    if (costs.length === 0) return 0;

    const avgDailyCost = this.mean(costs);
    return avgDailyCost * 30;
  }

  /**
   * Normalize prompt for comparison
   */
  private normalizePrompt(inputData: any): string {
    if (typeof inputData === 'string') {
      return inputData.trim();
    }
    return JSON.stringify(inputData);
  }

  /**
   * Truncate string with ellipsis
   */
  private truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 3) + '...';
  }

  /**
   * Group array by key
   */
  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const value = String(item[key]);
      (groups[value] = groups[value] || []).push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  /**
   * Count occurrences by function
   */
  private countBy<T>(array: T[], fn: (item: T) => string): Record<string, number> {
    return array.reduce((counts, item) => {
      const key = fn(item);
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }

  /**
   * Calculate mean of numbers
   */
  private mean(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
  }
}

/**
 * Parse JSONL trace file
 */
export function parseTraceFile(content: string): Trace[] {
  const lines = content.trim().split('\n');
  const traces: Trace[] = [];

  for (const line of lines) {
    if (line.trim()) {
      try {
        traces.push(JSON.parse(line));
      } catch (e) {
        console.error('Failed to parse trace line:', e);
      }
    }
  }

  return traces;
}

/**
 * Generate sample trace data for demo mode
 */
export function generateSampleTraces(): Trace[] {
  const platforms = ['openai', 'anthropic', 'bedrock'];
  const models = ['gpt-4-turbo', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet'];
  const traces: Trace[] = [];

  const now = new Date();
  for (let i = 0; i < 100; i++) {
    const timestamp = new Date(now.getTime() - i * 3600000); // 1 hour intervals
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const model = models[Math.floor(Math.random() * models.length)];

    traces.push({
      timestamp: timestamp.toISOString(),
      platform,
      model,
      input_data: `Sample prompt ${i}`,
      output_data: `Sample response ${i}`,
      cost: Math.random() * 0.1,
      confidence: 0.7 + Math.random() * 0.3,
      metadata: {
        tokens: {
          prompt: Math.floor(Math.random() * 1000) + 100,
          completion: Math.floor(Math.random() * 500) + 50
        },
        latency_ms: Math.floor(Math.random() * 2000) + 100
      }
    });
  }

  return traces;
}
