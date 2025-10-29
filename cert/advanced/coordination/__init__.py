"""
Coordination Monitor for CERT Framework.

Multi-agent coordination effectiveness measurement with:
- Gamma (γ): Coordination effect = coordinated / baseline performance
- Omega (Ω): Emergence indicator
- Consensus rate: Agreement between agents
- Cost tracking and limits
- Quality drift detection

Author: Javier Marín
Version: 1.0.0
License: MIT
"""

__version__ = "1.0.0"

from cert.advanced.coordination.baseline import BaselineCache, BaselineMeasurer
from cert.advanced.coordination.client import AnthropicClientWithResilience
from cert.advanced.coordination.evaluator import QualityEvaluator
from cert.advanced.coordination.orchestrator import CoordinationOrchestrator
from cert.advanced.coordination.types import (
    AgentResponse,
    BaselineMeasurement,
    CoordinationMetrics,
)

__all__ = [
    # Data structures
    "AgentResponse",
    "BaselineMeasurement",
    "CoordinationMetrics",
    # Core components
    "AnthropicClientWithResilience",
    "CoordinationOrchestrator",
    "QualityEvaluator",
    "BaselineMeasurer",
    "BaselineCache",
]
