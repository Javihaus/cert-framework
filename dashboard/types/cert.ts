/**
 * Type definitions matching cert-framework's output formats.
 * These types must match the Python dataclasses exactly.
 */

export interface TraceEntry {
  timestamp: string;
  query: string;
  context: string;
  answer: string;
  latency_ms: number;
  error?: string;
}

export interface MeasurementResult {
  matched: boolean;
  confidence: number;
  semantic_score?: number;
  nli_score?: number;
  grounding_score?: number;
  threshold_used: number;
  rule: string;
  components_used: string[];
}

export interface EvaluationResult {
  trace_id: string;
  timestamp: string;
  query: string;
  measurement: MeasurementResult;
  passed: boolean;
}

export interface EvaluationSummary {
  total_traces: number;
  evaluated_traces: number;
  passed_traces: number;
  failed_traces: number;
  accuracy: number;
  mean_confidence: number;
  threshold_used: number;
  date_range: {
    start: string;
    end: string;
  };
}

export interface ComplianceReport {
  system_name: string;
  risk_level: 'high' | 'medium' | 'low';
  report_date: string;
  evaluation_summary: EvaluationSummary;
  examples: EvaluationResult[];
}
