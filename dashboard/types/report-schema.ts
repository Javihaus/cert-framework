/**
 * Shared data schemas for document generation.
 *
 * These TypeScript interfaces mirror the Python dataclasses in cert/compliance/schemas.py.
 * Both systems consume identical JSON structures, ensuring synchronization.
 *
 * IMPORTANT: Any changes to Python schemas MUST be reflected here.
 */

export interface SystemMetadata {
  system_name: string;
  system_version: string;
  provider_name: string;
  intended_purpose: string;
  report_date: string; // ISO 8601
  evaluator_name?: string;
}

export interface PerformanceMetrics {
  total_traces: number;
  evaluated_traces: number;
  passed_traces: number;
  failed_traces: number;
  accuracy_percentage: number;
  mean_confidence: number;
  median_confidence: number;
  threshold_used: number;
}

export interface TemporalAnalysis {
  period_start: string; // ISO 8601
  period_end: string; // ISO 8601
  daily_accuracy: Array<{ date: string; accuracy: number }>;
}

export interface FailedTrace {
  timestamp: string;
  context: string;
  answer: string;
  confidence: number;
  reason: string;
  input_query?: string;
}

/**
 * Complete Article 15 compliance report structure.
 *
 * This is the contract between CLI (.docx) and dashboard (PDF).
 * Any changes must be reflected in both rendering systems.
 */
export interface Article15Report {
  metadata: SystemMetadata;
  performance: PerformanceMetrics;
  temporal: TemporalAnalysis;
  failed_traces: FailedTrace[];
  evaluation_methodology: string;
  compliance_statement: string;
}

export interface TraceStatistics {
  total_traces: number;
  avg_latency_ms: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  error_count: number;
  error_rate: number;
}

export interface Anomaly {
  type: "latency_spike" | "accuracy_drop" | "error_burst";
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string;
  affected_traces: number;
}

/**
 * Template 6: Production monitoring summary.
 */
export interface MonitoringReport {
  metadata: SystemMetadata;
  monitoring_period: TemporalAnalysis;
  trace_statistics: TraceStatistics;
  accuracy_distribution: Array<{ bucket: string; count: number }>;
  anomalies: Anomaly[];
  recommendations: string[];
}
