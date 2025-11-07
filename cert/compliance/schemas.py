"""
Shared data schemas for document generation.

These dataclasses define the contract between CLI (.docx) and dashboard (PDF)
renderers. Both systems consume identical JSON structures, ensuring synchronization.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass
class SystemMetadata:
    """Core system information - used by both .docx and PDF renderers."""

    system_name: str
    system_version: str
    provider_name: str
    intended_purpose: str
    report_date: str  # ISO 8601 format
    evaluator_name: Optional[str] = None


@dataclass
class PerformanceMetrics:
    """Evaluation results - identical structure for both renderers."""

    total_traces: int
    evaluated_traces: int
    passed_traces: int
    failed_traces: int
    accuracy_percentage: float
    mean_confidence: float
    median_confidence: float
    threshold_used: float


@dataclass
class TemporalAnalysis:
    """Time-based metrics."""

    period_start: str  # ISO 8601
    period_end: str  # ISO 8601
    daily_accuracy: List[Dict[str, float]] = field(default_factory=list)


@dataclass
class FailedTrace:
    """Individual failure example."""

    timestamp: str
    context: str
    answer: str
    confidence: float
    reason: str
    input_query: Optional[str] = None


@dataclass
class Article15Report:
    """Complete Article 15 compliance report structure.

    This is the contract between CLI and dashboard. Any changes here
    must be reflected in both rendering systems.
    """

    metadata: SystemMetadata
    performance: PerformanceMetrics
    temporal: TemporalAnalysis
    failed_traces: List[FailedTrace]
    evaluation_methodology: str
    compliance_statement: str


@dataclass
class TraceStatistics:
    """Trace-level statistics for monitoring report."""

    total_traces: int
    avg_latency_ms: float
    p50_latency_ms: float
    p95_latency_ms: float
    p99_latency_ms: float
    error_count: int
    error_rate: float


@dataclass
class Anomaly:
    """Detected anomaly in production traces."""

    type: str  # "latency_spike", "accuracy_drop", "error_burst"
    description: str
    severity: str  # "low", "medium", "high", "critical"
    timestamp: str
    affected_traces: int


@dataclass
class MonitoringReport:
    """Template 6: Production monitoring summary."""

    metadata: SystemMetadata
    monitoring_period: TemporalAnalysis
    trace_statistics: TraceStatistics
    accuracy_distribution: List[Dict[str, float]]  # Histogram buckets
    anomalies: List[Anomaly]
    recommendations: List[str]
