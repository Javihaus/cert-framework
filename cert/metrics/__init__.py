"""Metric calculators for agent monitoring.

This module provides implementations for all metrics used by agent_monitor():
- Consistency: Behavioral reliability measurement
- Performance: Output quality scoring
- Latency: Response time analysis
- Output Quality: Length, diversity, repetition analysis
- Robustness: Error handling and reliability
"""

from .consistency import calculate_consistency
from .performance import calculate_performance
from .latency import calculate_latency
from .output_quality import calculate_output_quality
from .robustness import calculate_robustness

__all__ = [
    "calculate_consistency",
    "calculate_performance",
    "calculate_latency",
    "calculate_output_quality",
    "calculate_robustness",
]
