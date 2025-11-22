"""
Token Usage Analytics for LLM Systems

This module provides comprehensive token usage tracking and analysis:
- Per-model and per-endpoint token tracking
- Cost estimation and trends
- Usage optimization recommendations
- Quota management
- Pattern analysis
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any
from collections import deque
from enum import Enum
import statistics
import json


class UsageTrend(Enum):
    """Token usage trends."""
    DECREASING = "decreasing"
    STABLE = "stable"
    INCREASING = "increasing"
    SPIKE = "spike"


@dataclass
class TokenUsage:
    """A single token usage record."""

    request_id: str
    model: str
    endpoint: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    cost_usd: float
    timestamp: datetime = field(default_factory=datetime.utcnow)
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "request_id": self.request_id,
            "model": self.model,
            "endpoint": self.endpoint,
            "input_tokens": self.input_tokens,
            "output_tokens": self.output_tokens,
            "total_tokens": self.total_tokens,
            "cost_usd": self.cost_usd,
            "timestamp": self.timestamp.isoformat(),
            "metadata": self.metadata,
        }


@dataclass
class UsageSummary:
    """Summary of token usage."""

    total_requests: int
    total_input_tokens: int
    total_output_tokens: int
    total_tokens: int
    total_cost_usd: float
    avg_input_tokens: float
    avg_output_tokens: float
    avg_cost_usd: float
    period_start: datetime
    period_end: datetime

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "total_requests": self.total_requests,
            "total_input_tokens": self.total_input_tokens,
            "total_output_tokens": self.total_output_tokens,
            "total_tokens": self.total_tokens,
            "total_cost_usd": self.total_cost_usd,
            "avg_input_tokens": self.avg_input_tokens,
            "avg_output_tokens": self.avg_output_tokens,
            "avg_cost_usd": self.avg_cost_usd,
            "period_start": self.period_start.isoformat(),
            "period_end": self.period_end.isoformat(),
        }


@dataclass
class QuotaConfig:
    """Quota configuration for token usage limits."""

    daily_token_limit: int | None = None
    monthly_token_limit: int | None = None
    daily_cost_limit_usd: float | None = None
    monthly_cost_limit_usd: float | None = None
    per_request_token_limit: int | None = None


@dataclass
class QuotaStatus:
    """Current quota status."""

    daily_tokens_used: int
    daily_tokens_remaining: int | None
    daily_cost_used: float
    daily_cost_remaining: float | None
    monthly_tokens_used: int
    monthly_tokens_remaining: int | None
    monthly_cost_used: float
    monthly_cost_remaining: float | None
    is_within_quota: bool
    warnings: list[str]

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "daily_tokens_used": self.daily_tokens_used,
            "daily_tokens_remaining": self.daily_tokens_remaining,
            "daily_cost_used": self.daily_cost_used,
            "daily_cost_remaining": self.daily_cost_remaining,
            "monthly_tokens_used": self.monthly_tokens_used,
            "monthly_tokens_remaining": self.monthly_tokens_remaining,
            "monthly_cost_used": self.monthly_cost_used,
            "monthly_cost_remaining": self.monthly_cost_remaining,
            "is_within_quota": self.is_within_quota,
            "warnings": self.warnings,
        }


# Pricing data for common models (per 1K tokens)
MODEL_PRICING = {
    # OpenAI models
    "gpt-4": {"input": 0.03, "output": 0.06},
    "gpt-4-turbo": {"input": 0.01, "output": 0.03},
    "gpt-4o": {"input": 0.005, "output": 0.015},
    "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
    "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
    "o1": {"input": 0.015, "output": 0.06},
    "o1-mini": {"input": 0.003, "output": 0.012},
    # Anthropic models
    "claude-3-opus": {"input": 0.015, "output": 0.075},
    "claude-3-sonnet": {"input": 0.003, "output": 0.015},
    "claude-3-haiku": {"input": 0.00025, "output": 0.00125},
    "claude-3.5-sonnet": {"input": 0.003, "output": 0.015},
    "claude-sonnet-4": {"input": 0.003, "output": 0.015},
    # Google models
    "gemini-pro": {"input": 0.00025, "output": 0.0005},
    "gemini-1.5-pro": {"input": 0.00125, "output": 0.005},
    # Defaults
    "default": {"input": 0.001, "output": 0.002},
}


class TokenAnalytics:
    """
    Token usage analytics for LLM systems.

    Provides comprehensive tracking and analysis of token usage patterns,
    cost estimation, quota management, and optimization recommendations.

    Example:
        analytics = TokenAnalytics(
            quota_config=QuotaConfig(daily_cost_limit_usd=100.0)
        )

        # Record usage
        analytics.record(
            model="gpt-4",
            endpoint="chat",
            input_tokens=100,
            output_tokens=500
        )

        # Get summary
        summary = analytics.get_summary(window_hours=24)
        print(f"Total cost: ${summary.total_cost_usd:.2f}")

        # Check quota
        status = analytics.check_quota()
        print(f"Within quota: {status.is_within_quota}")
    """

    def __init__(
        self,
        quota_config: QuotaConfig | None = None,
        window_size: int = 100000,
        custom_pricing: dict[str, dict[str, float]] | None = None,
    ):
        """
        Initialize token analytics.

        Args:
            quota_config: Quota configuration for limits
            window_size: Maximum records to keep in memory
            custom_pricing: Custom pricing overrides (per 1K tokens)
        """
        self.quota_config = quota_config or QuotaConfig()
        self.window_size = window_size

        self._pricing = MODEL_PRICING.copy()
        if custom_pricing:
            self._pricing.update(custom_pricing)

        self._usage: deque[TokenUsage] = deque(maxlen=window_size)
        self._request_counter = 0

    def _get_pricing(self, model: str) -> dict[str, float]:
        """Get pricing for a model."""
        # Try exact match first
        if model in self._pricing:
            return self._pricing[model]

        # Try partial match
        model_lower = model.lower()
        for key, pricing in self._pricing.items():
            if key in model_lower:
                return pricing

        return self._pricing["default"]

    def _calculate_cost(
        self,
        model: str,
        input_tokens: int,
        output_tokens: int,
    ) -> float:
        """Calculate cost for token usage."""
        pricing = self._get_pricing(model)
        input_cost = (input_tokens / 1000) * pricing["input"]
        output_cost = (output_tokens / 1000) * pricing["output"]
        return input_cost + output_cost

    def record(
        self,
        model: str,
        endpoint: str,
        input_tokens: int,
        output_tokens: int,
        cost_usd: float | None = None,
        request_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> TokenUsage:
        """
        Record a token usage event.

        Args:
            model: Model name
            endpoint: Endpoint name
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            cost_usd: Cost in USD (calculated if not provided)
            request_id: Request ID (generated if not provided)
            metadata: Additional metadata

        Returns:
            The recorded TokenUsage
        """
        self._request_counter += 1
        if request_id is None:
            request_id = f"req_{int(datetime.utcnow().timestamp())}_{self._request_counter}"

        if cost_usd is None:
            cost_usd = self._calculate_cost(model, input_tokens, output_tokens)

        usage = TokenUsage(
            request_id=request_id,
            model=model,
            endpoint=endpoint,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=input_tokens + output_tokens,
            cost_usd=cost_usd,
            metadata=metadata or {},
        )

        self._usage.append(usage)
        return usage

    def get_summary(
        self,
        window_hours: int | None = None,
        model: str | None = None,
        endpoint: str | None = None,
    ) -> UsageSummary | None:
        """
        Get usage summary.

        Args:
            window_hours: Time window in hours
            model: Filter by model
            endpoint: Filter by endpoint

        Returns:
            UsageSummary or None if no data
        """
        records = list(self._usage)

        # Apply time filter
        if window_hours:
            cutoff = datetime.utcnow() - timedelta(hours=window_hours)
            records = [r for r in records if r.timestamp >= cutoff]

        # Apply model filter
        if model:
            records = [r for r in records if r.model == model]

        # Apply endpoint filter
        if endpoint:
            records = [r for r in records if r.endpoint == endpoint]

        if not records:
            return None

        total_input = sum(r.input_tokens for r in records)
        total_output = sum(r.output_tokens for r in records)
        total_cost = sum(r.cost_usd for r in records)
        count = len(records)

        return UsageSummary(
            total_requests=count,
            total_input_tokens=total_input,
            total_output_tokens=total_output,
            total_tokens=total_input + total_output,
            total_cost_usd=total_cost,
            avg_input_tokens=total_input / count,
            avg_output_tokens=total_output / count,
            avg_cost_usd=total_cost / count,
            period_start=min(r.timestamp for r in records),
            period_end=max(r.timestamp for r in records),
        )

    def check_quota(self) -> QuotaStatus:
        """Check current quota status."""
        now = datetime.utcnow()
        day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Calculate daily usage
        daily_records = [r for r in self._usage if r.timestamp >= day_start]
        daily_tokens = sum(r.total_tokens for r in daily_records)
        daily_cost = sum(r.cost_usd for r in daily_records)

        # Calculate monthly usage
        monthly_records = [r for r in self._usage if r.timestamp >= month_start]
        monthly_tokens = sum(r.total_tokens for r in monthly_records)
        monthly_cost = sum(r.cost_usd for r in monthly_records)

        # Check quota limits
        warnings = []
        is_within_quota = True

        daily_tokens_remaining = None
        daily_cost_remaining = None
        monthly_tokens_remaining = None
        monthly_cost_remaining = None

        if self.quota_config.daily_token_limit:
            daily_tokens_remaining = self.quota_config.daily_token_limit - daily_tokens
            if daily_tokens_remaining < 0:
                warnings.append("Daily token limit exceeded")
                is_within_quota = False
            elif daily_tokens_remaining < self.quota_config.daily_token_limit * 0.1:
                warnings.append("Daily token limit nearly exhausted (>90% used)")

        if self.quota_config.daily_cost_limit_usd:
            daily_cost_remaining = self.quota_config.daily_cost_limit_usd - daily_cost
            if daily_cost_remaining < 0:
                warnings.append("Daily cost limit exceeded")
                is_within_quota = False
            elif daily_cost_remaining < self.quota_config.daily_cost_limit_usd * 0.1:
                warnings.append("Daily cost limit nearly exhausted (>90% used)")

        if self.quota_config.monthly_token_limit:
            monthly_tokens_remaining = self.quota_config.monthly_token_limit - monthly_tokens
            if monthly_tokens_remaining < 0:
                warnings.append("Monthly token limit exceeded")
                is_within_quota = False
            elif monthly_tokens_remaining < self.quota_config.monthly_token_limit * 0.1:
                warnings.append("Monthly token limit nearly exhausted (>90% used)")

        if self.quota_config.monthly_cost_limit_usd:
            monthly_cost_remaining = self.quota_config.monthly_cost_limit_usd - monthly_cost
            if monthly_cost_remaining < 0:
                warnings.append("Monthly cost limit exceeded")
                is_within_quota = False
            elif monthly_cost_remaining < self.quota_config.monthly_cost_limit_usd * 0.1:
                warnings.append("Monthly cost limit nearly exhausted (>90% used)")

        return QuotaStatus(
            daily_tokens_used=daily_tokens,
            daily_tokens_remaining=daily_tokens_remaining,
            daily_cost_used=daily_cost,
            daily_cost_remaining=daily_cost_remaining,
            monthly_tokens_used=monthly_tokens,
            monthly_tokens_remaining=monthly_tokens_remaining,
            monthly_cost_used=monthly_cost,
            monthly_cost_remaining=monthly_cost_remaining,
            is_within_quota=is_within_quota,
            warnings=warnings,
        )

    def get_model_breakdown(
        self,
        window_hours: int | None = None,
    ) -> dict[str, UsageSummary]:
        """Get usage breakdown by model."""
        records = list(self._usage)

        if window_hours:
            cutoff = datetime.utcnow() - timedelta(hours=window_hours)
            records = [r for r in records if r.timestamp >= cutoff]

        models = set(r.model for r in records)
        breakdown = {}

        for model in models:
            summary = self.get_summary(window_hours=window_hours, model=model)
            if summary:
                breakdown[model] = summary

        return breakdown

    def get_endpoint_breakdown(
        self,
        window_hours: int | None = None,
    ) -> dict[str, UsageSummary]:
        """Get usage breakdown by endpoint."""
        records = list(self._usage)

        if window_hours:
            cutoff = datetime.utcnow() - timedelta(hours=window_hours)
            records = [r for r in records if r.timestamp >= cutoff]

        endpoints = set(r.endpoint for r in records)
        breakdown = {}

        for endpoint in endpoints:
            summary = self.get_summary(window_hours=window_hours, endpoint=endpoint)
            if summary:
                breakdown[endpoint] = summary

        return breakdown

    def get_trend(
        self,
        window_hours: int = 24,
        bucket_hours: int = 1,
    ) -> list[dict[str, Any]]:
        """
        Get usage trend over time.

        Args:
            window_hours: Total time window
            bucket_hours: Size of each time bucket

        Returns:
            List of usage stats per bucket
        """
        cutoff = datetime.utcnow() - timedelta(hours=window_hours)
        records = [r for r in self._usage if r.timestamp >= cutoff]

        if not records:
            return []

        # Group by bucket
        buckets: dict[int, list[TokenUsage]] = {}
        for r in records:
            bucket_key = int(r.timestamp.timestamp() // (bucket_hours * 3600))
            if bucket_key not in buckets:
                buckets[bucket_key] = []
            buckets[bucket_key].append(r)

        # Calculate stats per bucket
        trend = []
        for bucket_key in sorted(buckets.keys()):
            bucket_records = buckets[bucket_key]
            bucket_time = datetime.fromtimestamp(bucket_key * bucket_hours * 3600)

            total_tokens = sum(r.total_tokens for r in bucket_records)
            total_cost = sum(r.cost_usd for r in bucket_records)

            trend.append({
                "timestamp": bucket_time.isoformat(),
                "requests": len(bucket_records),
                "total_tokens": total_tokens,
                "total_cost_usd": total_cost,
                "avg_tokens_per_request": total_tokens / len(bucket_records),
            })

        return trend

    def analyze_trend(
        self,
        window_hours: int = 24,
    ) -> UsageTrend:
        """Analyze the usage trend direction."""
        trend_data = self.get_trend(window_hours=window_hours, bucket_hours=1)

        if len(trend_data) < 3:
            return UsageTrend.STABLE

        # Get token counts per bucket
        tokens = [d["total_tokens"] for d in trend_data]

        # Calculate moving average
        if len(tokens) >= 6:
            first_half = statistics.mean(tokens[:len(tokens)//2])
            second_half = statistics.mean(tokens[len(tokens)//2:])

            # Check for spike (sudden large increase)
            max_token = max(tokens)
            mean_token = statistics.mean(tokens)
            if max_token > mean_token * 3:
                return UsageTrend.SPIKE

            # Check trend direction
            change_percent = (second_half - first_half) / first_half * 100 if first_half > 0 else 0

            if change_percent > 20:
                return UsageTrend.INCREASING
            elif change_percent < -20:
                return UsageTrend.DECREASING

        return UsageTrend.STABLE

    def get_optimization_recommendations(
        self,
        window_hours: int = 168,  # 1 week
    ) -> list[dict[str, Any]]:
        """
        Generate cost optimization recommendations.

        Args:
            window_hours: Analysis window in hours

        Returns:
            List of optimization recommendations
        """
        recommendations = []
        model_breakdown = self.get_model_breakdown(window_hours=window_hours)

        # Check for expensive model usage
        expensive_models = ["gpt-4", "claude-3-opus", "o1"]
        for model, summary in model_breakdown.items():
            for expensive in expensive_models:
                if expensive in model.lower() and summary.total_cost_usd > 10:
                    recommendations.append({
                        "type": "model_downgrade",
                        "priority": "high",
                        "model": model,
                        "current_cost": summary.total_cost_usd,
                        "potential_savings_percent": 60,
                        "recommendation": f"Consider using a smaller model for simple tasks. "
                                        f"Current {model} usage costs ${summary.total_cost_usd:.2f}. "
                                        f"Switching to GPT-4o-mini or Claude-3-Haiku for suitable "
                                        f"tasks could save up to 60%.",
                    })

        # Check for high output token usage
        summary = self.get_summary(window_hours=window_hours)
        if summary and summary.avg_output_tokens > summary.avg_input_tokens * 3:
            recommendations.append({
                "type": "output_optimization",
                "priority": "medium",
                "avg_output_tokens": summary.avg_output_tokens,
                "avg_input_tokens": summary.avg_input_tokens,
                "recommendation": "High output token usage detected. Consider adding instructions "
                                "to produce more concise responses, or implement response length limits.",
            })

        # Check trend for cost increase
        trend = self.analyze_trend(window_hours=window_hours)
        if trend == UsageTrend.INCREASING:
            recommendations.append({
                "type": "usage_monitoring",
                "priority": "medium",
                "trend": trend.value,
                "recommendation": "Token usage is trending upward. Review recent changes "
                                "and consider implementing caching for repeated queries.",
            })

        return recommendations

    def export_usage(
        self,
        filepath: str,
        window_hours: int | None = None,
    ) -> bool:
        """Export usage data to JSON file."""
        try:
            records = list(self._usage)
            if window_hours:
                cutoff = datetime.utcnow() - timedelta(hours=window_hours)
                records = [r for r in records if r.timestamp >= cutoff]

            data = [r.to_dict() for r in records]
            with open(filepath, "w") as f:
                json.dump(data, f, indent=2)
            return True
        except Exception:
            return False

    def update_pricing(
        self,
        model: str,
        input_price_per_1k: float,
        output_price_per_1k: float,
    ) -> None:
        """Update pricing for a model."""
        self._pricing[model] = {
            "input": input_price_per_1k,
            "output": output_price_per_1k,
        }
