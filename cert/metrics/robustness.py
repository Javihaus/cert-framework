"""Robustness metric calculator.

Measures error handling and reliability by tracking success/error/timeout rates.
"""

import logging
from typing import List

from cert.core.types import RobustnessMetric

logger = logging.getLogger(__name__)


def calculate_robustness(
    successes: int,
    errors: int,
    timeouts: int,
    error_messages: List[str] = None,
) -> RobustnessMetric:
    """Calculate robustness metrics from trial outcomes.

    Robustness measures how well the model handles errors, timeouts,
    and edge cases. Higher success rate = more robust.

    Args:
        successes: Number of successful trials
        errors: Number of trials that errored
        timeouts: Number of trials that timed out
        error_messages: List of error messages (for debugging)

    Returns:
        RobustnessMetric with:
            - success_rate: Successful response rate (0.0-1.0)
            - error_rate: Error rate (0.0-1.0)
            - timeout_rate: Timeout rate (0.0-1.0)
            - num_trials: Total trials attempted
            - errors: List of error messages

    Raises:
        ValueError: If no trials provided

    Example:
        metric = calculate_robustness(
            successes=18,
            errors=1,
            timeouts=1,
            error_messages=["API timeout", "Rate limit exceeded"]
        )
        print(f"Success rate: {metric.success_rate:.1%}")
    """
    total_trials = successes + errors + timeouts

    if total_trials == 0:
        raise ValueError("Must have at least one trial")

    logger.debug(
        f"Calculating robustness: {successes} success, "
        f"{errors} errors, {timeouts} timeouts"
    )

    # Calculate rates
    success_rate = successes / total_trials
    error_rate = errors / total_trials
    timeout_rate = timeouts / total_trials

    logger.info(
        f"Robustness: success={success_rate:.1%}, "
        f"error={error_rate:.1%}, timeout={timeout_rate:.1%}"
    )

    return RobustnessMetric(
        success_rate=success_rate,
        error_rate=error_rate,
        timeout_rate=timeout_rate,
        num_trials=total_trials,
        errors=error_messages or [],
    )
