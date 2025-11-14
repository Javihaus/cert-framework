"""
Cost Analysis Module
====================

Analyzes AI/LLM costs from traced calls to provide insights on spending
patterns, trends, and anomalies.
"""

import json
import statistics
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from collections import defaultdict
from pathlib import Path


class CostAnalyzer:
    """
    Analyzer for AI/LLM costs.

    This class loads traces from JSONL files and provides various
    cost analysis methods.
    """

    def __init__(self, traces_path: str):
        """
        Initialize the cost analyzer.

        Args:
            traces_path: Path to JSONL file containing traces
        """
        self.traces_path = traces_path
        self.traces = self._load_traces(traces_path)

    def _load_traces(self, path: str) -> List[Dict[str, Any]]:
        """
        Load traces from JSONL file.

        Args:
            path: Path to JSONL file

        Returns:
            List of trace dictionaries
        """
        traces = []

        if not Path(path).exists():
            return traces

        with open(path, "r") as f:
            for line in f:
                try:
                    trace = json.loads(line.strip())
                    traces.append(trace)
                except json.JSONDecodeError:
                    continue

        return traces

    def total_cost(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> float:
        """
        Calculate total spending over a time period.

        Args:
            start_date: Start of period (inclusive)
            end_date: End of period (inclusive)

        Returns:
            Total cost in USD
        """
        filtered = self._filter_by_date(self.traces, start_date, end_date)
        return sum(t.get("cost", 0) or 0 for t in filtered)

    def cost_by_model(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, float]:
        """
        Break down costs by model.

        Args:
            start_date: Start of period
            end_date: End of period

        Returns:
            Dictionary mapping model names to costs
        """
        filtered = self._filter_by_date(self.traces, start_date, end_date)
        costs = defaultdict(float)

        for trace in filtered:
            model = trace.get("model", "unknown")
            cost = trace.get("cost", 0) or 0
            costs[model] += cost

        return dict(costs)

    def cost_by_platform(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, float]:
        """
        Break down costs by platform.

        Args:
            start_date: Start of period
            end_date: End of period

        Returns:
            Dictionary mapping platform names to costs
        """
        filtered = self._filter_by_date(self.traces, start_date, end_date)
        costs = defaultdict(float)

        for trace in filtered:
            platform = trace.get("platform", "unknown")
            cost = trace.get("cost", 0) or 0
            costs[platform] += cost

        return dict(costs)

    def cost_trend(
        self,
        granularity: str = "daily",
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, float]:
        """
        Generate time series of costs.

        Args:
            granularity: Time granularity ("daily", "weekly", "monthly")
            start_date: Start of period
            end_date: End of period

        Returns:
            Dictionary mapping time periods to costs
        """
        filtered = self._filter_by_date(self.traces, start_date, end_date)
        trends = defaultdict(float)

        for trace in filtered:
            timestamp = trace.get("timestamp")
            if not timestamp:
                continue

            date_key = self._truncate_timestamp(timestamp, granularity)
            cost = trace.get("cost", 0) or 0
            trends[date_key] += cost

        return dict(sorted(trends.items()))

    def detect_anomalies(
        self,
        threshold_stddev: float = 2.0
    ) -> List[Dict[str, Any]]:
        """
        Detect unusual cost spikes.

        Args:
            threshold_stddev: Number of standard deviations for anomaly detection

        Returns:
            List of anomalies with details
        """
        daily_costs = self.cost_trend("daily")

        if len(daily_costs) < 7:  # Need at least a week of data
            return []

        costs = list(daily_costs.values())
        mean = statistics.mean(costs)
        stddev = statistics.stdev(costs) if len(costs) > 1 else 0

        anomalies = []
        for date, cost in daily_costs.items():
            if stddev > 0 and cost > mean + (threshold_stddev * stddev):
                severity = "critical" if cost > mean + (3 * stddev) else "high"

                anomalies.append({
                    "date": date,
                    "cost": round(cost, 2),
                    "expected": round(mean, 2),
                    "deviation": round((cost - mean) / stddev, 2),
                    "severity": severity,
                    "percent_increase": round(((cost - mean) / mean) * 100, 1),
                })

        return sorted(anomalies, key=lambda x: x["deviation"], reverse=True)

    def cost_per_successful_task(
        self,
        accuracy_threshold: float = 0.7
    ) -> Optional[float]:
        """
        Calculate cost divided by success rate.

        Args:
            accuracy_threshold: Minimum accuracy/confidence for success

        Returns:
            Cost per successful task, or None if no successful tasks
        """
        total_cost = self.total_cost()

        successful = sum(
            1 for t in self.traces
            if t.get("metadata", {}).get("confidence", 0) >= accuracy_threshold
            or (not t.get("error") and t.get("output_data"))
        )

        if successful == 0:
            return None

        return total_cost / successful

    def get_summary(
        self,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get comprehensive cost summary.

        Args:
            days: Number of days to analyze

        Returns:
            Summary dictionary with key metrics
        """
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        total = self.total_cost(start_date, end_date)
        by_model = self.cost_by_model(start_date, end_date)
        by_platform = self.cost_by_platform(start_date, end_date)
        daily_trend = self.cost_trend("daily", start_date, end_date)

        # Calculate daily average
        daily_avg = total / days if days > 0 else 0

        # Project monthly
        monthly_projection = daily_avg * 30

        # Find top model
        top_model = max(by_model.items(), key=lambda x: x[1]) if by_model else ("N/A", 0)

        # Detect anomalies
        anomalies = self.detect_anomalies()

        return {
            "period": {
                "start": start_date.isoformat() + "Z",
                "end": end_date.isoformat() + "Z",
                "days": days,
            },
            "costs": {
                "total": round(total, 2),
                "daily_average": round(daily_avg, 2),
                "monthly_projection": round(monthly_projection, 2),
            },
            "by_model": {k: round(v, 2) for k, v in sorted(
                by_model.items(), key=lambda x: x[1], reverse=True
            )},
            "by_platform": {k: round(v, 2) for k, v in sorted(
                by_platform.items(), key=lambda x: x[1], reverse=True
            )},
            "top_model": {
                "name": top_model[0],
                "cost": round(top_model[1], 2),
                "percentage": round((top_model[1] / total * 100) if total > 0 else 0, 1),
            },
            "anomalies": anomalies,
            "total_traces": len(self._filter_by_date(self.traces, start_date, end_date)),
        }

    def _filter_by_date(
        self,
        traces: List[Dict],
        start_date: Optional[datetime],
        end_date: Optional[datetime]
    ) -> List[Dict]:
        """
        Filter traces by date range.

        Args:
            traces: List of traces
            start_date: Start date (inclusive)
            end_date: End date (inclusive)

        Returns:
            Filtered list of traces
        """
        if not start_date and not end_date:
            return traces

        filtered = []
        for trace in traces:
            timestamp_str = trace.get("timestamp")
            if not timestamp_str:
                continue

            try:
                # Parse ISO 8601 timestamp
                timestamp = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))

                # Convert to naive UTC for comparison
                timestamp = timestamp.replace(tzinfo=None)

                if start_date and timestamp < start_date:
                    continue
                if end_date and timestamp > end_date:
                    continue

                filtered.append(trace)
            except (ValueError, AttributeError):
                continue

        return filtered

    def _truncate_timestamp(self, timestamp_str: str, granularity: str) -> str:
        """
        Truncate timestamp to specified granularity.

        Args:
            timestamp_str: ISO 8601 timestamp
            granularity: "daily", "weekly", or "monthly"

        Returns:
            Truncated timestamp string
        """
        try:
            dt = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
            dt = dt.replace(tzinfo=None)

            if granularity == "daily":
                return dt.strftime("%Y-%m-%d")
            elif granularity == "weekly":
                # Week starting Monday
                start_of_week = dt - timedelta(days=dt.weekday())
                return start_of_week.strftime("%Y-W%U")
            elif granularity == "monthly":
                return dt.strftime("%Y-%m")
            else:
                return dt.strftime("%Y-%m-%d")

        except (ValueError, AttributeError):
            return "unknown"
