"""Base classes for CERT benchmark metrics.

This module provides the abstract base class and registry pattern for
implementing pluggable metrics in the benchmark framework.
"""

import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Type


class MetricBase(ABC):
    """Abstract base class for all CERT benchmark metrics.

    All metric implementations must inherit from this class and implement
    the calculate() and validate() methods.

    The metric system follows these design principles:
    1. Single Responsibility: Each metric measures one aspect
    2. Independence: Metrics can be calculated independently
    3. Testability: Each metric is unit-testable in isolation
    4. Pluggability: New metrics can be added without modifying core engine
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize metric with optional configuration.

        Args:
            config: Optional metric-specific configuration
        """
        self.config = config or {}
        self.logger = logging.getLogger(self.__class__.__name__)
        self.results: List[Any] = []

    @abstractmethod
    async def calculate(self, data: Dict[str, Any]) -> Any:
        """Calculate metric from collected data.

        This is the core method that each metric must implement.

        Args:
            data: Input data dictionary containing:
                - responses: List of model responses
                - timings: List of response latencies (if applicable)
                - errors: List of error information (if applicable)
                - provider: Provider name
                - model: Model identifier
                - ... other metric-specific data

        Returns:
            Result object (e.g., LatencyResult, ConsistencyResult)

        Raises:
            ValueError: If data is invalid or insufficient
        """
        pass

    @abstractmethod
    def validate(self, value: Any) -> bool:
        """Validate that calculated value is in valid range.

        Args:
            value: Calculated metric value

        Returns:
            True if valid, False otherwise
        """
        pass

    def get_name(self) -> str:
        """Get metric name.

        Returns:
            Metric name (defaults to class name without 'Metric' suffix)
        """
        name = self.__class__.__name__
        if name.endswith("Metric"):
            name = name[:-6]  # Remove 'Metric' suffix
        return name.lower()

    def export(self, format: str = "dict") -> Any:
        """Export results in requested format.

        Args:
            format: Export format ('dict', 'json', 'csv')

        Returns:
            Exported results in specified format
        """
        if not self.results:
            return None

        if format == "dict":
            return [r.to_dict() if hasattr(r, "to_dict") else r for r in self.results]
        elif format == "json":
            import json

            return json.dumps(self.export(format="dict"), indent=2)
        elif format == "csv":
            # Simple CSV export - override in subclass for custom formatting
            import io
            import csv

            output = io.StringIO()
            if self.results and hasattr(self.results[0], "to_dict"):
                dict_results = [r.to_dict() for r in self.results]
                if dict_results:
                    writer = csv.DictWriter(output, fieldnames=dict_results[0].keys())
                    writer.writeheader()
                    writer.writerows(dict_results)
            return output.getvalue()
        else:
            raise ValueError(f"Unsupported export format: {format}")


class MetricRegistry:
    """Registry for pluggable metrics.

    This registry enables dynamic metric loading and allows users to
    add custom metrics without modifying the core framework.

    Usage:
        # Register a new metric
        @MetricRegistry.register("my_metric")
        class MyMetric(MetricBase):
            async def calculate(self, data):
                ...

        # Get registered metric
        metric_class = MetricRegistry.get("my_metric")
        metric = metric_class(config={})

        # List available metrics
        available = MetricRegistry.list_available()
    """

    _metrics: Dict[str, Type[MetricBase]] = {}

    @classmethod
    def register(cls, name: str):
        """Decorator to register a new metric.

        Args:
            name: Metric name (e.g., 'latency', 'consistency')

        Returns:
            Decorator function

        Example:
            @MetricRegistry.register("latency")
            class LatencyMetric(MetricBase):
                async def calculate(self, data):
                    return LatencyResult(...)
        """

        def decorator(metric_class: Type[MetricBase]):
            if not issubclass(metric_class, MetricBase):
                raise TypeError(
                    f"Metric class {metric_class.__name__} must inherit from MetricBase"
                )
            cls._metrics[name] = metric_class
            return metric_class

        return decorator

    @classmethod
    def get(cls, name: str) -> Type[MetricBase]:
        """Retrieve registered metric by name.

        Args:
            name: Metric name

        Returns:
            Metric class

        Raises:
            ValueError: If metric not found
        """
        if name not in cls._metrics:
            available = ", ".join(cls._metrics.keys())
            raise ValueError(
                f"Metric '{name}' not registered. Available metrics: {available}"
            )
        return cls._metrics[name]

    @classmethod
    def list_available(cls) -> List[str]:
        """List all registered metrics.

        Returns:
            List of metric names
        """
        return list(cls._metrics.keys())

    @classmethod
    def is_registered(cls, name: str) -> bool:
        """Check if metric is registered.

        Args:
            name: Metric name

        Returns:
            True if registered
        """
        return name in cls._metrics

    @classmethod
    def clear(cls):
        """Clear all registered metrics (mainly for testing).

        Warning: This removes all registered metrics. Use with caution.
        """
        cls._metrics.clear()
