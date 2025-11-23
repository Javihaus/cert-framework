"""
Metric Configuration
====================

Configuration for metric calculations with sensible defaults.
"""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class CostConfig:
    """Cost metric configuration."""

    currency: str = "EUR"
    weekly_budget: Optional[float] = None
    monthly_budget: Optional[float] = None
    enable_alerts: bool = False
    alert_threshold: float = 0.9  # Alert when 90% of budget used


@dataclass
class HealthConfig:
    """Health metric configuration."""

    # Latency thresholds
    p95_latency_threshold_ms: float = 2000.0  # 2 seconds
    max_latency_threshold_ms: float = 10000.0  # 10 seconds

    # Error rate thresholds
    critical_error_rate: float = 0.1  # 10% errors = critical
    warning_error_rate: float = 0.05  # 5% errors = warning

    # Latency penalty calculation
    # Requests above p95 threshold count as "slow"
    latency_penalty_weight: float = 0.5  # How much slow requests affect health


@dataclass
class QualityConfig:
    """Quality metric configuration."""

    # Default evaluation method
    evaluation_method: str = "semantic_consistency"  # or "ground_truth"

    # Semantic evaluation settings
    semantic_threshold: float = 0.7  # Minimum similarity for pass
    preset: str = "general"  # general, financial, healthcare, legal

    # Ground truth evaluation
    evaluation_dataset_path: Optional[str] = None

    # Quality thresholds
    critical_quality: float = 70.0  # Below this = critical
    warning_quality: float = 85.0  # Below this = warning


@dataclass
class MetricConfig:
    """
    Complete metric configuration with sensible defaults.

    All settings are optional and have sensible defaults that work
    out of the box without any configuration.
    """

    cost: CostConfig = field(default_factory=CostConfig)
    health: HealthConfig = field(default_factory=HealthConfig)
    quality: QualityConfig = field(default_factory=QualityConfig)

    # Time windows
    default_time_window: str = "week"  # week, day, month

    # Data sources
    traces_path: str = "cert_traces.jsonl"

    @classmethod
    def default(cls) -> "MetricConfig":
        """Get default configuration."""
        return cls()

    @classmethod
    def from_dict(cls, data: dict) -> "MetricConfig":
        """Create configuration from dictionary."""
        config = cls()

        if "cost" in data:
            for key, value in data["cost"].items():
                if hasattr(config.cost, key):
                    setattr(config.cost, key, value)

        if "health" in data:
            for key, value in data["health"].items():
                if hasattr(config.health, key):
                    setattr(config.health, key, value)

        if "quality" in data:
            for key, value in data["quality"].items():
                if hasattr(config.quality, key):
                    setattr(config.quality, key, value)

        if "default_time_window" in data:
            config.default_time_window = data["default_time_window"]

        if "traces_path" in data:
            config.traces_path = data["traces_path"]

        return config

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "cost": {
                "currency": self.cost.currency,
                "weekly_budget": self.cost.weekly_budget,
                "monthly_budget": self.cost.monthly_budget,
                "enable_alerts": self.cost.enable_alerts,
                "alert_threshold": self.cost.alert_threshold,
            },
            "health": {
                "p95_latency_threshold_ms": self.health.p95_latency_threshold_ms,
                "max_latency_threshold_ms": self.health.max_latency_threshold_ms,
                "critical_error_rate": self.health.critical_error_rate,
                "warning_error_rate": self.health.warning_error_rate,
                "latency_penalty_weight": self.health.latency_penalty_weight,
            },
            "quality": {
                "evaluation_method": self.quality.evaluation_method,
                "semantic_threshold": self.quality.semantic_threshold,
                "preset": self.quality.preset,
                "evaluation_dataset_path": self.quality.evaluation_dataset_path,
                "critical_quality": self.quality.critical_quality,
                "warning_quality": self.quality.warning_quality,
            },
            "default_time_window": self.default_time_window,
            "traces_path": self.traces_path,
        }
