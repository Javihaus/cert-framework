"""
Data types for coordination monitoring.

Provides:
- CoordinationMetrics (gamma, omega, consensus rate)
- AgentResponse
- BaselineMeasurement
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List


@dataclass
class AgentResponse:
    """Response from a single agent."""
    agent_id: str
    response: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "agent_id": self.agent_id,
            "response": self.response,
            "metadata": self.metadata,
            "timestamp": self.timestamp.isoformat(),
        }


@dataclass
class BaselineMeasurement:
    """Baseline quality measurement for independent agents."""
    agent_responses: List[AgentResponse]
    quality_scores: List[float]
    mean_quality: float
    timestamp: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "agent_responses": [r.to_dict() for r in self.agent_responses],
            "quality_scores": self.quality_scores,
            "mean_quality": self.mean_quality,
            "timestamp": self.timestamp.isoformat(),
        }


@dataclass
class CoordinationMetrics:
    """Coordination monitoring metrics."""

    # Core metrics
    gamma: float  # Coordination effect = coordinated / baseline
    omega: float  # Emergence indicator (coordinated - best_individual)
    consensus_rate: float  # Agreement between agents (0-1)

    # Quality measurements
    baseline_quality: float  # Independent agent quality
    coordinated_quality: float  # Coordinated system quality
    best_individual_quality: float  # Best individual agent

    # Response details
    agent_responses: List[AgentResponse]
    coordinated_response: str

    # Metadata
    task: str
    num_agents: int
    strategy: str  # "sequential", "parallel", "debate"
    timestamp: datetime = field(default_factory=datetime.now)

    def is_coordination_effective(self) -> bool:
        """Check if coordination improved performance (gamma > 1.0)."""
        return self.gamma > 1.0

    def has_emergence(self) -> bool:
        """Check if coordinated response exceeds best individual (omega > 0)."""
        return self.omega > 0.0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "gamma": self.gamma,
            "omega": self.omega,
            "consensus_rate": self.consensus_rate,
            "baseline_quality": self.baseline_quality,
            "coordinated_quality": self.coordinated_quality,
            "best_individual_quality": self.best_individual_quality,
            "coordination_effective": self.is_coordination_effective(),
            "emergence_detected": self.has_emergence(),
            "agent_responses": [r.to_dict() for r in self.agent_responses],
            "coordinated_response": self.coordinated_response,
            "task": self.task,
            "num_agents": self.num_agents,
            "strategy": self.strategy,
            "timestamp": self.timestamp.isoformat(),
        }
