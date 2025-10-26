"""
Health check framework for services.

Provides:
- Health check protocol
- Readiness vs liveness checks
- Dependency health aggregation
"""

import logging
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Dict

logger = logging.getLogger(__name__)


class HealthStatus(Enum):
    """Service health status."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"


@dataclass
class HealthCheckResult:
    """Result of health check."""
    status: HealthStatus
    message: str
    checks: Dict[str, bool]
    timestamp: datetime

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses."""
        return {
            "status": self.status.value,
            "message": self.message,
            "checks": self.checks,
            "timestamp": self.timestamp.isoformat(),
        }


class HealthChecker:
    """Aggregate health checks from multiple components."""

    def __init__(self):
        self._checks: Dict[str, Callable[[], bool]] = {}

    def register(self, name: str, check: Callable[[], bool]):
        """
        Register a health check function.

        Args:
            name: Name of the health check
            check: Function that returns True if healthy, False otherwise
        """
        self._checks[name] = check
        logger.debug(f"Registered health check: {name}")

    def unregister(self, name: str):
        """
        Unregister a health check.

        Args:
            name: Name of the health check to remove
        """
        if name in self._checks:
            del self._checks[name]
            logger.debug(f"Unregistered health check: {name}")

    def check_health(self) -> HealthCheckResult:
        """
        Run all health checks.

        Returns:
            HealthCheckResult with aggregated status
        """
        results = {}

        for name, check in self._checks.items():
            try:
                results[name] = check()
                if not results[name]:
                    logger.warning(f"Health check '{name}' failed")
            except Exception as e:
                logger.error(f"Health check '{name}' raised exception: {e}")
                results[name] = False

        # Determine overall status
        if not results:
            # No checks registered
            status = HealthStatus.HEALTHY
            message = "No health checks registered"
        elif all(results.values()):
            status = HealthStatus.HEALTHY
            message = "All systems operational"
        elif any(results.values()):
            status = HealthStatus.DEGRADED
            message = "Some systems degraded"
        else:
            status = HealthStatus.UNHEALTHY
            message = "Systems unhealthy"

        return HealthCheckResult(
            status=status,
            message=message,
            checks=results,
            timestamp=datetime.now(),
        )

    def check_readiness(self) -> bool:
        """
        Check if service is ready to accept requests.

        Returns:
            True if all health checks pass
        """
        result = self.check_health()
        return result.status == HealthStatus.HEALTHY

    def check_liveness(self) -> bool:
        """
        Check if service is alive (basic functionality).

        Returns:
            True if service is not completely unhealthy
        """
        result = self.check_health()
        return result.status != HealthStatus.UNHEALTHY
