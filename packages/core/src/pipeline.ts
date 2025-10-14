import {
  Agent,
  AgentResult,
  FailureLocalization,
  TestConfig,
} from './types.js';
import { measureConsistency, hasPromptVariance } from './consistency.js';

/**
 * Analyzes multi-agent pipelines to automatically locate which agent is causing failures.
 * Uses binary search approach to efficiently find the problematic component.
 */
export class PipelineAnalyzer {
  /**
   * Localizes which agent in a pipeline is causing consistency failures.
   *
   * This method tests each prefix of the pipeline (Agent1, Agent1→2, Agent1→2→3, etc.)
   * and identifies where consistency drops below the threshold.
   *
   * @param pipeline - Array of agents to test
   * @param initialInput - Input to feed to the first agent
   * @param config - Test configuration
   * @returns Failure localization result with diagnosis and suggestions
   *
   * @example
   * ```typescript
   * const analyzer = new PipelineAnalyzer();
   * const result = await analyzer.localizeFailure(
   *   [retriever, extractor, formatter],
   *   "What was Apple's revenue?",
   *   { nTrials: 10, consistencyThreshold: 0.85 }
   * );
   * console.log(result.failingAgent); // "Agent2" (extractor)
   * console.log(result.diagnosis);
   * ```
   */
  async localizeFailure(
    pipeline: Agent[],
    initialInput: any,
    config: TestConfig
  ): Promise<FailureLocalization> {
    const results: AgentResult[] = [];

    // Test each prefix of the pipeline
    for (let i = 0; i < pipeline.length; i++) {
      const partialPipeline = pipeline.slice(0, i + 1);

      const consistency = await measureConsistency(
        () => this.runPipeline(partialPipeline, initialInput),
        config
      );

      results.push({
        agent: partialPipeline[partialPipeline.length - 1].name,
        consistency: consistency.consistency,
        outputs: consistency.outputs,
      });

      // Found the problem
      if (consistency.consistency < config.consistencyThreshold) {
        return {
          failingAgent: partialPipeline[partialPipeline.length - 1].name,
          diagnosis: this.diagnoseAgent(
            partialPipeline[partialPipeline.length - 1].name,
            consistency.consistency,
            i,
            results
          ),
          evidence: consistency.evidence,
          suggestions: this.suggestFixes(i, results, consistency),
        };
      }
    }

    return {
      status: 'all-agents-consistent',
    };
  }

  /**
   * Runs a partial pipeline and returns the final output.
   */
  private async runPipeline(
    agents: Agent[],
    initialInput: any
  ): Promise<any> {
    let output = initialInput;

    for (const agent of agents) {
      output = await agent.execute(output);
    }

    return output;
  }

  /**
   * Generates a diagnosis for the failing agent.
   */
  private diagnoseAgent(
    agentName: string,
    consistency: number,
    index: number,
    results: AgentResult[]
  ): string {
    const variance = (1 - consistency) * 100;

    let diagnosis = `${agentName} adds ${variance.toFixed(
      1
    )}% variance to the pipeline. `;

    if (index > 0) {
      const prevConsistency = results[index - 1].consistency;
      const drop = (prevConsistency - consistency) * 100;
      diagnosis += `Consistency dropped from ${(prevConsistency * 100).toFixed(
        1
      )}% to ${(consistency * 100).toFixed(1)}% (${drop.toFixed(
        1
      )}% decrease). `;
    }

    return diagnosis;
  }

  /**
   * Suggests fixes based on the variance pattern.
   */
  private suggestFixes(
    failingIndex: number,
    results: AgentResult[],
    consistency: any
  ): string[] {
    const suggestions: string[] = [];

    // Check if variance is in prompt interpretation
    if (hasPromptVariance(consistency.outputs)) {
      suggestions.push(
        `${results[failingIndex].agent} prompt may be ambiguous - try more specific instructions`
      );
    }

    // Check if removing agent improves consistency
    if (failingIndex > 0) {
      const prevAgent = results[failingIndex - 1];
      const currentAgent = results[failingIndex];

      if (prevAgent.consistency > currentAgent.consistency + 0.1) {
        suggestions.push(
          `Consider removing ${currentAgent.agent} - previous agent was ${(
            (prevAgent.consistency - currentAgent.consistency) *
            100
          ).toFixed(1)}% more consistent`
        );
      }
    }

    // Check for temperature settings
    if (consistency.uniqueCount > consistency.outputs.length * 0.7) {
      suggestions.push(
        `${results[failingIndex].agent} shows high variance - set temperature=0 if using LLM`
      );
    }

    // Check for non-deterministic operations
    const outputs = consistency.outputs;
    const hasTimestamps = outputs.some((o: any) =>
      JSON.stringify(o).match(/\d{4}-\d{2}-\d{2}/)
    );
    if (hasTimestamps) {
      suggestions.push(
        `${results[failingIndex].agent} outputs contain timestamps - check for non-deterministic date/time operations`
      );
    }

    // General debugging suggestions
    suggestions.push(
      `Test ${results[failingIndex].agent} in isolation with fixed input to debug`
    );
    suggestions.push(
      `Review ${results[failingIndex].agent} for random sampling, database queries, or API calls with non-deterministic results`
    );

    return suggestions;
  }

  /**
   * Calculates the gamma metric (pipeline contribution to variance).
   *
   * Gamma measures how much variance the pipeline introduces compared to
   * individual agent variance.
   *
   * γ = variance_pipeline / sum(variance_agents)
   * - γ < 1: Pipeline reduces variance (agents cancel out errors)
   * - γ = 1: Pipeline variance equals sum of parts (neutral)
   * - γ > 1: Pipeline amplifies variance (agents compound errors)
   *
   * @param results - Array of agent results from pipeline testing
   * @returns Gamma value
   */
  calculateGamma(results: AgentResult[]): number {
    if (results.length === 0) return 1.0;

    // Variance = 1 - consistency
    const pipelineVariance = 1 - results[results.length - 1].consistency;
    const sumAgentVariance = results.reduce(
      (sum, r) => sum + (1 - r.consistency),
      0
    );

    if (sumAgentVariance === 0) return 1.0;

    return pipelineVariance / sumAgentVariance;
  }

  /**
   * Interprets the gamma value and provides guidance.
   */
  interpretGamma(gamma: number): {
    interpretation: string;
    recommendation: string;
  } {
    if (gamma < 0.8) {
      return {
        interpretation: 'Pipeline reduces variance (agents stabilize each other)',
        recommendation:
          'This is ideal. Agents are complementary and error-correcting.',
      };
    } else if (gamma >= 0.8 && gamma <= 1.2) {
      return {
        interpretation: 'Pipeline has neutral effect on variance',
        recommendation:
          'Pipeline is functioning as expected. Each agent contributes independently.',
      };
    } else {
      return {
        interpretation: 'Pipeline amplifies variance (agents compound errors)',
        recommendation:
          'This is problematic. Later agents may be propagating errors from earlier agents. ' +
          'Consider adding validation between stages or simplifying the pipeline.',
      };
    }
  }
}
