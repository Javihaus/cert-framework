"""
Metrics Engine
==============

Unified metrics computation engine for Cost, Health, and Quality metrics.
Aggregates data from existing CERT components with sensible defaults.
"""

import json
import statistics
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from cert.metrics.config import MetricConfig
from cert.metrics.types import (
    CostMetric,
    HealthMetric,
    QualityMetric,
    MetricsSnapshot,
    TimeWindow,
)


class MetricsEngine:
    """
    Unified metrics computation engine.

    Computes the three primary metrics (Cost, Health, Quality) from trace data
    with sensible defaults that work out of the box.

    Example:
        >>> engine = MetricsEngine("cert_traces.jsonl")
        >>> metrics = engine.get_metrics()
        >>> print(f"Cost: €{metrics.cost.value:.2f} ({metrics.cost.trend_display})")
        >>> print(f"Health: {metrics.health.value:.1f}% ({metrics.health.status.value})")
        >>> print(f"Quality: {metrics.quality.value:.1f}%")
    """

    def __init__(
        self,
        traces_path: str,
        config: Optional[MetricConfig] = None,
    ):
        """
        Initialize the metrics engine.

        Args:
            traces_path: Path to JSONL file containing traces
            config: Optional configuration (uses sensible defaults if not provided)
        """
        self.traces_path = traces_path
        self.config = config or MetricConfig.default()
        self._traces: Optional[List[Dict[str, Any]]] = None

    @property
    def traces(self) -> List[Dict[str, Any]]:
        """Lazy-load traces from file."""
        if self._traces is None:
            self._traces = self._load_traces(self.traces_path)
        return self._traces

    def reload_traces(self) -> None:
        """Force reload traces from file."""
        self._traces = None

    def _load_traces(self, path: str) -> List[Dict[str, Any]]:
        """Load traces from JSONL file."""
        traces = []

        if not Path(path).exists():
            return traces

        with open(path) as f:
            for line in f:
                try:
                    trace = json.loads(line.strip())
                    traces.append(trace)
                except json.JSONDecodeError:
                    continue

        return traces

    def _get_time_window_dates(
        self, time_window: str
    ) -> Tuple[datetime, datetime, datetime, datetime]:
        """
        Get date ranges for current and previous time windows.

        Returns:
            Tuple of (current_start, current_end, previous_start, previous_end)
        """
        now = datetime.utcnow()

        window_mapping = {
            "hour": timedelta(hours=1),
            "day": timedelta(days=1),
            "week": timedelta(days=7),
            "month": timedelta(days=30),
        }

        delta = window_mapping.get(time_window, timedelta(days=7))

        current_end = now
        current_start = now - delta
        previous_end = current_start
        previous_start = current_start - delta

        return current_start, current_end, previous_start, previous_end

    def _filter_traces_by_date(
        self,
        traces: List[Dict],
        start_date: datetime,
        end_date: datetime,
    ) -> List[Dict]:
        """Filter traces by date range."""
        filtered = []

        for trace in traces:
            timestamp_str = trace.get("timestamp")
            if not timestamp_str:
                continue

            try:
                # Parse ISO 8601 timestamp
                timestamp = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
                timestamp = timestamp.replace(tzinfo=None)

                if start_date <= timestamp <= end_date:
                    filtered.append(trace)
            except (ValueError, AttributeError):
                continue

        return filtered

    def _calculate_percentile(self, values: List[float], p: float) -> float:
        """Calculate percentile of a list of values."""
        if not values:
            return 0.0
        sorted_values = sorted(values)
        k = (len(sorted_values) - 1) * p / 100
        f = int(k)
        c = f + 1 if f + 1 < len(sorted_values) else f
        if f == c:
            return sorted_values[int(k)]
        return sorted_values[f] * (c - k) + sorted_values[c] * (k - f)

    def cost_metric(self, time_window: str = "week") -> CostMetric:
        """
        Calculate cost metric for the time window.

        Cost = Sum of trace.cost over time window
        Trend = Percentage change from previous period

        Args:
            time_window: Time window for calculation (hour, day, week, month)

        Returns:
            CostMetric with value, trend, and breakdowns
        """
        current_start, current_end, previous_start, previous_end = (
            self._get_time_window_dates(time_window)
        )

        current_traces = self._filter_traces_by_date(
            self.traces, current_start, current_end
        )
        previous_traces = self._filter_traces_by_date(
            self.traces, previous_start, previous_end
        )

        # Calculate current period cost
        current_cost = sum(
            t.get("cost", 0) or t.get("metadata", {}).get("cost", 0) or 0
            for t in current_traces
        )

        # Calculate previous period cost
        previous_cost = sum(
            t.get("cost", 0) or t.get("metadata", {}).get("cost", 0) or 0
            for t in previous_traces
        )

        # Calculate trend
        if previous_cost > 0:
            trend = ((current_cost - previous_cost) / previous_cost) * 100
        else:
            trend = 0.0 if current_cost == 0 else 100.0

        # Breakdown by model
        by_model: Dict[str, float] = defaultdict(float)
        for trace in current_traces:
            model = (
                trace.get("model")
                or trace.get("metadata", {}).get("model")
                or "unknown"
            )
            cost = trace.get("cost", 0) or trace.get("metadata", {}).get("cost", 0) or 0
            by_model[model] += cost

        # Breakdown by platform
        by_platform: Dict[str, float] = defaultdict(float)
        for trace in current_traces:
            platform = (
                trace.get("platform")
                or trace.get("metadata", {}).get("platform")
                or "unknown"
            )
            cost = trace.get("cost", 0) or trace.get("metadata", {}).get("cost", 0) or 0
            by_platform[platform] += cost

        # Calculate daily average and projection
        window_days = TimeWindow(time_window).to_days()
        daily_average = current_cost / window_days if window_days > 0 else 0
        monthly_projection = daily_average * 30

        # Budget utilization
        budget_utilization = None
        budget = None
        if time_window == "week" and self.config.cost.weekly_budget:
            budget = self.config.cost.weekly_budget
            budget_utilization = (current_cost / budget) * 100 if budget > 0 else 0
        elif time_window == "month" and self.config.cost.monthly_budget:
            budget = self.config.cost.monthly_budget
            budget_utilization = (current_cost / budget) * 100 if budget > 0 else 0

        return CostMetric(
            value=current_cost,
            trend=trend,
            currency=self.config.cost.currency,
            by_model=dict(by_model),
            by_platform=dict(by_platform),
            daily_average=daily_average,
            monthly_projection=monthly_projection,
            budget=budget,
            budget_utilization=budget_utilization,
            time_window=time_window,
            trace_count=len(current_traces),
        )

    def health_metric(self, time_window: str = "week") -> HealthMetric:
        """
        Calculate health metric for the time window.

        Health = 100 * (1 - error_rate - latency_penalty)
        Where:
            error_rate = count(traces with error) / count(all traces)
            latency_penalty = count(traces > p95 threshold) / count(all traces) * weight

        Args:
            time_window: Time window for calculation (hour, day, week, month)

        Returns:
            HealthMetric with score, trend, and components
        """
        current_start, current_end, previous_start, previous_end = (
            self._get_time_window_dates(time_window)
        )

        current_traces = self._filter_traces_by_date(
            self.traces, current_start, current_end
        )
        previous_traces = self._filter_traces_by_date(
            self.traces, previous_start, previous_end
        )

        if not current_traces:
            return HealthMetric(
                value=100.0,
                trend=0.0,
                error_rate=0.0,
                p95_latency=0.0,
                time_window=time_window,
            )

        # Calculate error rate
        error_count = sum(
            1
            for t in current_traces
            if t.get("error") or t.get("status") == "error"
        )
        error_rate = error_count / len(current_traces)

        # Calculate latencies
        latencies = []
        for trace in current_traces:
            latency = (
                trace.get("duration_ms")
                or trace.get("latency_ms")
                or trace.get("metadata", {}).get("latency_ms")
            )
            if latency is not None:
                latencies.append(latency)

        # Calculate P95 latency
        p95_latency = self._calculate_percentile(latencies, 95) if latencies else 0.0

        # Calculate latency penalty (slow requests)
        threshold = self.config.health.p95_latency_threshold_ms
        slow_count = sum(1 for l in latencies if l > threshold)
        latency_penalty = (slow_count / len(current_traces)) * self.config.health.latency_penalty_weight

        # Calculate health score
        health_score = max(0.0, 100.0 * (1 - error_rate - latency_penalty))

        # Calculate SLA compliance
        sla_compliant_count = sum(
            1 for l in latencies if l <= self.config.health.max_latency_threshold_ms
        )
        sla_compliance = (sla_compliant_count / len(latencies) * 100) if latencies else 100.0

        # Calculate previous period health for trend
        previous_health = 100.0
        if previous_traces:
            prev_error_count = sum(
                1
                for t in previous_traces
                if t.get("error") or t.get("status") == "error"
            )
            prev_error_rate = prev_error_count / len(previous_traces)
            prev_latencies = []
            for trace in previous_traces:
                latency = (
                    trace.get("duration_ms")
                    or trace.get("latency_ms")
                    or trace.get("metadata", {}).get("latency_ms")
                )
                if latency is not None:
                    prev_latencies.append(latency)
            prev_slow_count = sum(1 for l in prev_latencies if l > threshold)
            prev_latency_penalty = (
                (prev_slow_count / len(previous_traces)) * self.config.health.latency_penalty_weight
                if previous_traces
                else 0
            )
            previous_health = max(0.0, 100.0 * (1 - prev_error_rate - prev_latency_penalty))

        trend = health_score - previous_health

        # Identify issues
        issues = []
        if error_rate > self.config.health.critical_error_rate:
            issues.append(f"Critical: Error rate ({error_rate*100:.1f}%) exceeds threshold")
        elif error_rate > self.config.health.warning_error_rate:
            issues.append(f"Warning: Elevated error rate ({error_rate*100:.1f}%)")

        if p95_latency > self.config.health.p95_latency_threshold_ms:
            issues.append(f"Warning: P95 latency ({p95_latency:.0f}ms) exceeds threshold")

        return HealthMetric(
            value=health_score,
            trend=trend,
            error_rate=error_rate,
            p95_latency=p95_latency,
            latency_penalty=latency_penalty,
            sla_compliance=sla_compliance,
            total_requests=len(current_traces),
            error_count=error_count,
            slow_request_count=slow_count,
            issues=issues,
            time_window=time_window,
        )

    def quality_metric(self, time_window: str = "week") -> QualityMetric:
        """
        Calculate quality metric for the time window.

        Default mode (semantic_consistency):
            Quality based on semantic similarity between context and answer.

        Ground truth mode:
            Quality based on accuracy against evaluation dataset.

        Args:
            time_window: Time window for calculation (hour, day, week, month)

        Returns:
            QualityMetric with score, trend, and evaluation details
        """
        current_start, current_end, previous_start, previous_end = (
            self._get_time_window_dates(time_window)
        )

        current_traces = self._filter_traces_by_date(
            self.traces, current_start, current_end
        )
        previous_traces = self._filter_traces_by_date(
            self.traces, previous_start, previous_end
        )

        method = self.config.quality.evaluation_method

        if method == "ground_truth" and self.config.quality.evaluation_dataset_path:
            return self._quality_from_ground_truth(
                current_traces, previous_traces, time_window
            )

        return self._quality_from_semantic_consistency(
            current_traces, previous_traces, time_window
        )

    def _quality_from_semantic_consistency(
        self,
        current_traces: List[Dict],
        previous_traces: List[Dict],
        time_window: str,
    ) -> QualityMetric:
        """
        Calculate quality from semantic consistency.

        Uses existing evaluation results in traces or calculates basic consistency.
        """
        # Look for traces with evaluation results or confidence scores
        evaluations = []
        by_model: Dict[str, List[float]] = defaultdict(list)

        for trace in current_traces:
            # Check for existing evaluation results
            if "evaluation" in trace:
                eval_result = trace["evaluation"]
                score = eval_result.get("confidence", 0) * 100
                evaluations.append({
                    "passed": eval_result.get("matched", False),
                    "score": score,
                })
                model = trace.get("model", "unknown")
                by_model[model].append(score)

            # Check for confidence in metadata
            elif trace.get("metadata", {}).get("confidence"):
                conf = trace["metadata"]["confidence"]
                evaluations.append({
                    "passed": conf >= self.config.quality.semantic_threshold,
                    "score": conf * 100,
                })
                model = trace.get("model", "unknown")
                by_model[model].append(conf * 100)

            # Check for context and answer to compute basic quality
            elif trace.get("context") and trace.get("answer"):
                # Basic heuristic: longer answers with context present = higher quality
                # This is a fallback when no evaluation is available
                answer_len = len(trace.get("answer", ""))
                context_len = len(trace.get("context", ""))
                # Simple heuristic score
                score = min(100, (answer_len / max(context_len, 1)) * 50 + 50) if context_len > 0 else 50
                evaluations.append({
                    "passed": score >= self.config.quality.semantic_threshold * 100,
                    "score": score,
                })
                model = trace.get("model", "unknown")
                by_model[model].append(score)

        if not evaluations:
            return QualityMetric(
                value=100.0,  # No data = assume quality is good
                trend=0.0,
                method="semantic_consistency",
                time_window=time_window,
            )

        # Calculate current quality
        current_quality = statistics.mean(e["score"] for e in evaluations)
        passed_count = sum(1 for e in evaluations if e["passed"])
        accuracy_rate = passed_count / len(evaluations)
        consistency_score = current_quality / 100

        # Calculate by-model quality
        model_quality = {
            model: statistics.mean(scores) if scores else 0
            for model, scores in by_model.items()
        }

        # Calculate previous quality for trend
        previous_quality = 100.0
        if previous_traces:
            prev_evaluations = []
            for trace in previous_traces:
                if "evaluation" in trace:
                    prev_evaluations.append(trace["evaluation"].get("confidence", 0) * 100)
                elif trace.get("metadata", {}).get("confidence"):
                    prev_evaluations.append(trace["metadata"]["confidence"] * 100)

            if prev_evaluations:
                previous_quality = statistics.mean(prev_evaluations)

        trend = current_quality - previous_quality

        return QualityMetric(
            value=current_quality,
            trend=trend,
            method="semantic_consistency",
            accuracy_rate=accuracy_rate,
            consistency_score=consistency_score,
            evaluated_count=len(evaluations),
            passed_count=passed_count,
            failed_count=len(evaluations) - passed_count,
            by_model=model_quality,
            time_window=time_window,
        )

    def _quality_from_ground_truth(
        self,
        current_traces: List[Dict],
        previous_traces: List[Dict],
        time_window: str,
    ) -> QualityMetric:
        """
        Calculate quality from ground truth evaluation dataset.

        This requires the Evaluator module and an evaluation dataset.
        """
        try:
            from cert.evaluation.evaluator import Evaluator

            evaluator = Evaluator(
                threshold=self.config.quality.semantic_threshold,
                preset=self.config.quality.preset,
            )

            # Evaluate current traces
            results = evaluator.evaluate_traces(current_traces)

            current_quality = results["pass_rate"] * 100

            # Calculate previous quality for trend
            previous_quality = 100.0
            if previous_traces:
                prev_results = evaluator.evaluate_traces(previous_traces)
                previous_quality = prev_results["pass_rate"] * 100

            trend = current_quality - previous_quality

            return QualityMetric(
                value=current_quality,
                trend=trend,
                method="ground_truth",
                accuracy_rate=results["pass_rate"],
                consistency_score=results["pass_rate"],
                evaluated_count=results["total_traces"],
                passed_count=results["passed"],
                failed_count=results["failed"],
                time_window=time_window,
            )

        except ImportError:
            # Fall back to semantic consistency if evaluator not available
            return self._quality_from_semantic_consistency(
                current_traces, previous_traces, time_window
            )

    def get_metrics(self, time_window: Optional[str] = None) -> MetricsSnapshot:
        """
        Get all three metrics as a snapshot.

        Args:
            time_window: Time window for calculations (uses config default if not specified)

        Returns:
            MetricsSnapshot with cost, health, and quality metrics
        """
        window = time_window or self.config.default_time_window

        return MetricsSnapshot(
            cost=self.cost_metric(window),
            health=self.health_metric(window),
            quality=self.quality_metric(window),
            time_window=window,
        )

    def get_metrics_summary(self, time_window: Optional[str] = None) -> Dict[str, Any]:
        """
        Get a simplified metrics summary for dashboard display.

        Args:
            time_window: Time window for calculations

        Returns:
            Dictionary with simplified metric values
        """
        metrics = self.get_metrics(time_window)

        return {
            "cost": {
                "display": f"{metrics.cost.currency}{metrics.cost.value:,.2f}",
                "trend": metrics.cost.trend_display,
                "trend_direction": metrics.cost.trend_direction.value,
            },
            "health": {
                "display": f"{metrics.health.value:.1f}%",
                "trend": metrics.health.trend_display,
                "trend_direction": metrics.health.trend_direction.value,
                "status": metrics.health.status.value,
            },
            "quality": {
                "display": f"{metrics.quality.value:.1f}%",
                "trend": metrics.quality.trend_display,
                "trend_direction": metrics.quality.trend_direction.value,
                "method": metrics.quality.method_display,
            },
            "time_window": metrics.time_window,
            "timestamp": metrics.timestamp.isoformat() + "Z",
        }
