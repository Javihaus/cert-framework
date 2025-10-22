"""Robustness metric implementation.

Tracks error rates, timeouts, and exception patterns to assess production reliability.
"""

from collections import Counter

from ..types import RobustnessResult
from .base import MetricBase, MetricRegistry


@MetricRegistry.register("robustness")
class RobustnessMetric(MetricBase):
    """Robustness metric for CERT benchmarking.

    Assesses production reliability by tracking:
    - Error rate: Percentage of failed API calls
    - Timeout rate: Percentage of requests that exceeded timeout
    - Exception patterns: Types of errors encountered

    Robustness is critical for:
    - Production deployment confidence
    - SLA planning and monitoring
    - Identifying provider-specific failure modes
    """

    async def calculate(self, data: dict) -> RobustnessResult:
        """Calculate robustness metrics from execution data.

        Args:
            data: Dictionary containing:
                - metadata_list: List of ResponseMetadata objects
                - provider: Provider name
                - model: Model identifier

        Returns:
            RobustnessResult with error and timeout statistics

        Raises:
            ValueError: If data is invalid or insufficient
        """
        # Validate input
        if "metadata_list" not in data or not data["metadata_list"]:
            raise ValueError("No metadata provided")

        if "provider" not in data or "model" not in data:
            raise ValueError("Provider and model must be specified")

        metadata_list = data["metadata_list"]
        total_trials = len(metadata_list)

        if total_trials == 0:
            raise ValueError("At least 1 trial required for robustness analysis")

        # Count successes, errors, and timeouts
        successful = 0
        failed = 0
        timeouts = 0
        error_types = []

        for metadata in metadata_list:
            if metadata.error:
                failed += 1
                if metadata.timeout:
                    timeouts += 1

                # Extract error type from error message
                error_type = self._extract_error_type(metadata.error)
                error_types.append(error_type)
            else:
                successful += 1

        # Calculate rates
        error_rate = (failed / total_trials * 100) if total_trials > 0 else 0.0
        timeout_rate = (timeouts / total_trials * 100) if total_trials > 0 else 0.0

        # Count exception types
        exception_counts = dict(Counter(error_types))

        # Create result
        result = RobustnessResult(
            provider=data["provider"],
            model=data["model"],
            error_rate=error_rate,
            timeout_rate=timeout_rate,
            exception_counts=exception_counts,
            successful_trials=successful,
            failed_trials=failed,
            timeout_trials=timeouts,
            num_trials=total_trials,
        )

        # Validate result
        if not self.validate(result):
            raise ValueError("Calculated robustness metrics failed validation")

        # Store result
        self.results.append(result)

        self.logger.info(
            f"Robustness: {data['provider']}/{data['model']} - "
            f"error_rate={error_rate:.1f}%, timeout_rate={timeout_rate:.1f}%, "
            f"successful={successful}/{total_trials}"
        )

        return result

    def _extract_error_type(self, error_message: str) -> str:
        """Extract error type from error message.

        Args:
            error_message: Error message string

        Returns:
            Simplified error type classification
        """
        error_lower = error_message.lower()

        # Common error patterns
        if "timeout" in error_lower or "timed out" in error_lower:
            return "TimeoutError"
        elif "rate limit" in error_lower or "ratelimit" in error_lower:
            return "RateLimitError"
        elif (
            "authentication" in error_lower
            or "unauthorized" in error_lower
            or "401" in error_lower
        ):
            return "AuthenticationError"
        elif (
            "permission" in error_lower
            or "forbidden" in error_lower
            or "403" in error_lower
        ):
            return "PermissionError"
        elif "not found" in error_lower or "404" in error_lower:
            return "NotFoundError"
        elif (
            "server error" in error_lower
            or "500" in error_lower
            or "502" in error_lower
            or "503" in error_lower
        ):
            return "ServerError"
        elif "connection" in error_lower or "network" in error_lower:
            return "ConnectionError"
        elif (
            "invalid" in error_lower
            or "bad request" in error_lower
            or "400" in error_lower
        ):
            return "InvalidRequestError"
        else:
            return "UnknownError"

    def validate(self, value: RobustnessResult) -> bool:
        """Validate robustness result.

        Args:
            value: RobustnessResult to validate

        Returns:
            True if valid
        """
        # Rates must be between 0-100
        if not 0.0 <= value.error_rate <= 100.0:
            return False
        if not 0.0 <= value.timeout_rate <= 100.0:
            return False

        # Trial counts must be non-negative
        if value.successful_trials < 0:
            return False
        if value.failed_trials < 0:
            return False
        if value.timeout_trials < 0:
            return False
        if value.num_trials <= 0:
            return False

        # Sum of successful + failed must equal total
        if value.successful_trials + value.failed_trials != value.num_trials:
            return False

        # Timeouts must be subset of failures
        if value.timeout_trials > value.failed_trials:
            return False

        return True
