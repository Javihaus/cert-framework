"""
Reasoning Trajectory Monitor for CERT Framework.

MARKETING POSITION:
"Physics-inspired Hamiltonian trajectory analysis for production LLM monitoring"

ENGINEERING REALITY:
Per-token perplexity and entropy tracking with quality thresholds for:
- Hallucination detection
- Quality assurance gates
- EU AI Act compliance documentation

This extends CERT Framework's Trustworthiness (T) dimension as Tool #6.

Author: Javier Marín
Version: 1.0.0
License: MIT
"""

__version__ = "2.0.0"

# Public API exports
from cert.trajectory.types import (
    ReasoningMetrics,
    TrajectoryAnalysis,
    TrajectoryConfig
)

from cert.trajectory.monitor import ReasoningTrajectoryMonitor

from cert.trajectory.visualizer import HamiltonianVisualizer

from cert.trajectory.analyzer import CERTTrajectoryAnalyzer

from cert.trajectory.utils import (
    load_model_for_monitoring,
    unload_model
)

# Production API (v2.0+)
from cert.trajectory.api import HamiltonianMonitor
from cert.trajectory.engine import HamiltonianEngine
from cert.trajectory.resources import HamiltonianModelResource

__all__ = [
    # Data structures
    "ReasoningMetrics",
    "TrajectoryAnalysis",
    "TrajectoryConfig",

    # Core monitoring (legacy)
    "ReasoningTrajectoryMonitor",

    # Production API (v2.0+)
    "HamiltonianMonitor",
    "HamiltonianEngine",
    "HamiltonianModelResource",

    # Visualization
    "HamiltonianVisualizer",

    # CERT integration
    "CERTTrajectoryAnalyzer",

    # Utilities
    "load_model_for_monitoring",
    "unload_model",
]
