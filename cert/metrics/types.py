"""
Metric Type Definitions
=======================

Dataclasses for the three primary metrics: Cost, Health, and Quality.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional


class TimeWindow(Enum):
    """Time window for metric calculations."""

    HOUR = "hour"
    DAY = "day"
    WEEK = "week"
    MONTH = "month"

    def to_days(self) -> float:
        """Convert time window to days."""
        mapping = {
            TimeWindow.HOUR: 1 / 24,
            TimeWindow.DAY: 1,
            TimeWindow.WEEK: 7,
            TimeWindow.MONTH: 30,
        }
        return mapping[self]


class TrendDirection(Enum):
    """Direction of metric trend."""

    UP = "up"
    DOWN = "down"
    STABLE = "stable"


class HealthStatus(Enum):
    """System health status levels."""

    HEALTHY = "healthy"
    DEGRADED = "degraded"
    CRITICAL = "critical"


@dataclass
class CostMetric:
    """
    Cost metric representing total spending over a time window.

    Attributes:
        value: Total cost in the time window
        trend: Percentage change from previous period (-12.3 means down 12.3%)
        currency: Currency code (default EUR)
        by_model: Cost breakdown by model
        by_platform: Cost breakdown by platform
        daily_average: Average daily cost
        monthly_projection: Projected monthly cost
        budget: Optional budget limit
        budget_utilization: Percentage of budget used (if budget set)
    """

    value: float
    trend: float  # Percentage change from previous period
    currency: str = "EUR"
    by_model: Dict[str, float] = field(default_factory=dict)
    by_platform: Dict[str, float] = field(default_factory=dict)
    daily_average: float = 0.0
    monthly_projection: float = 0.0
    budget: Optional[float] = None
    budget_utilization: Optional[float] = None
    time_window: str = "week"
    trace_count: int = 0

    @property
    def trend_direction(self) -> TrendDirection:
        """Get trend direction."""
        if abs(self.trend) < 1.0:
            return TrendDirection.STABLE
        return TrendDirection.UP if self.trend > 0 else TrendDirection.DOWN

    @property
    def trend_display(self) -> str:
        """Get human-readable trend display."""
        if self.trend_direction == TrendDirection.STABLE:
            return "stable"
        symbol = "+" if self.trend > 0 else ""
        return f"{symbol}{self.trend:.1f}%"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response."""
        return {
            "value": round(self.value, 2),
            "trend": round(self.trend, 1),
            "trend_direction": self.trend_direction.value,
            "trend_display": self.trend_display,
            "currency": self.currency,
            "by_model": {k: round(v, 2) for k, v in self.by_model.items()},
            "by_platform": {k: round(v, 2) for k, v in self.by_platform.items()},
            "daily_average": round(self.daily_average, 2),
            "monthly_projection": round(self.monthly_projection, 2),
            "budget": self.budget,
            "budget_utilization": round(self.budget_utilization, 1)
            if self.budget_utilization
            else None,
            "time_window": self.time_window,
            "trace_count": self.trace_count,
        }


@dataclass
class HealthMetric:
    """
    Health metric representing system health score (0-100).

    Health = 100 * (1 - error_rate - latency_penalty)

    Attributes:
        value: Health score (0-100)
        trend: Percentage point change from previous period
        error_rate: Percentage of requests with errors (0-1)
        p95_latency: 95th percentile latency in ms
        latency_penalty: Penalty for slow requests (0-1)
        sla_compliance: Percentage of requests meeting SLA
        status: Overall health status (healthy/degraded/critical)
        issues: List of current issues affecting health
    """

    value: float  # 0-100
    trend: float  # Percentage point change
    error_rate: float  # 0-1
    p95_latency: float  # ms
    latency_penalty: float = 0.0  # 0-1
    sla_compliance: float = 100.0  # 0-100
    total_requests: int = 0
    error_count: int = 0
    slow_request_count: int = 0
    issues: List[str] = field(default_factory=list)
    time_window: str = "week"

    @property
    def status(self) -> HealthStatus:
        """Get health status based on score."""
        if self.value >= 90:
            return HealthStatus.HEALTHY
        elif self.value >= 70:
            return HealthStatus.DEGRADED
        return HealthStatus.CRITICAL

    @property
    def trend_direction(self) -> TrendDirection:
        """Get trend direction."""
        if abs(self.trend) < 0.5:
            return TrendDirection.STABLE
        return TrendDirection.UP if self.trend > 0 else TrendDirection.DOWN

    @property
    def trend_display(self) -> str:
        """Get human-readable trend display."""
        if self.trend_direction == TrendDirection.STABLE:
            return "stable"
        symbol = "+" if self.trend > 0 else ""
        return f"{symbol}{self.trend:.1f}%"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response."""
        return {
            "value": round(self.value, 1),
            "trend": round(self.trend, 1),
            "trend_direction": self.trend_direction.value,
            "trend_display": self.trend_display,
            "status": self.status.value,
            "error_rate": round(self.error_rate * 100, 2),  # As percentage
            "p95_latency": round(self.p95_latency, 0),
            "latency_penalty": round(self.latency_penalty * 100, 2),  # As percentage
            "sla_compliance": round(self.sla_compliance, 1),
            "total_requests": self.total_requests,
            "error_count": self.error_count,
            "slow_request_count": self.slow_request_count,
            "issues": self.issues,
            "time_window": self.time_window,
        }


@dataclass
class QualityMetric:
    """
    Quality metric representing output quality (0-100).

    Default mode: Semantic consistency between input/context and answer
    Advanced mode: Accuracy against ground truth evaluation dataset

    Attributes:
        value: Quality score (0-100)
        trend: Percentage point change from previous period
        method: Evaluation method used ("semantic_consistency" or "ground_truth")
        accuracy_rate: Percentage of evaluations that passed
        consistency_score: Semantic consistency score (0-1)
        evaluated_count: Number of traces evaluated
        by_model: Quality breakdown by model
    """

    value: float  # 0-100
    trend: float  # Percentage point change
    method: str = "semantic_consistency"  # or "ground_truth"
    accuracy_rate: float = 0.0  # 0-1
    consistency_score: float = 0.0  # 0-1
    evaluated_count: int = 0
    passed_count: int = 0
    failed_count: int = 0
    by_model: Dict[str, float] = field(default_factory=dict)
    time_window: str = "week"

    @property
    def trend_direction(self) -> TrendDirection:
        """Get trend direction."""
        if abs(self.trend) < 0.5:
            return TrendDirection.STABLE
        return TrendDirection.UP if self.trend > 0 else TrendDirection.DOWN

    @property
    def trend_display(self) -> str:
        """Get human-readable trend display."""
        if self.trend_direction == TrendDirection.STABLE:
            return "stable"
        symbol = "+" if self.trend > 0 else ""
        return f"{symbol}{self.trend:.1f}%"

    @property
    def method_display(self) -> str:
        """Get human-readable method name."""
        return {
            "semantic_consistency": "Semantic consistency",
            "ground_truth": "Ground truth accuracy",
        }.get(self.method, self.method)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response."""
        return {
            "value": round(self.value, 1),
            "trend": round(self.trend, 1),
            "trend_direction": self.trend_direction.value,
            "trend_display": self.trend_display,
            "method": self.method,
            "method_display": self.method_display,
            "accuracy_rate": round(self.accuracy_rate * 100, 1),  # As percentage
            "consistency_score": round(self.consistency_score * 100, 1),  # As percentage
            "evaluated_count": self.evaluated_count,
            "passed_count": self.passed_count,
            "failed_count": self.failed_count,
            "by_model": {k: round(v, 1) for k, v in self.by_model.items()},
            "time_window": self.time_window,
        }


@dataclass
class MetricsSnapshot:
    """
    Complete snapshot of all three metrics at a point in time.
    """

    cost: CostMetric
    health: HealthMetric
    quality: QualityMetric
    timestamp: datetime = field(default_factory=datetime.utcnow)
    time_window: str = "week"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response."""
        return {
            "cost": self.cost.to_dict(),
            "health": self.health.to_dict(),
            "quality": self.quality.to_dict(),
            "timestamp": self.timestamp.isoformat() + "Z",
            "time_window": self.time_window,
        }
