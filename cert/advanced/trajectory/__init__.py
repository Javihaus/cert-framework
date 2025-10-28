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
from cert.advanced.trajectory.types import ReasoningMetrics, TrajectoryAnalysis, TrajectoryConfig

from cert.advanced.trajectory.monitor import ReasoningTrajectoryMonitor

# Lazy import for optional dependencies
try:
    from cert.advanced.trajectory.visualizer import HamiltonianVisualizer
except ImportError:
    HamiltonianVisualizer = None

from cert.advanced.trajectory.analyzer import CERTTrajectoryAnalyzer

from cert.advanced.trajectory.utils import load_model_for_monitoring, unload_model

# Production API (v2.0+)
from cert.advanced.trajectory.api import HamiltonianMonitor
from cert.advanced.trajectory.engine import HamiltonianEngine
from cert.advanced.trajectory.resources import HamiltonianModelResource


# Convenience function for simple trajectory analysis
def analyze_trajectory(model, tokenizer, prompt: str, config: TrajectoryConfig = None):
    """
    Analyze a single generation with trajectory monitoring.

    Args:
        model: HuggingFace model
        tokenizer: Corresponding tokenizer
        prompt: Input prompt
        config: Optional TrajectoryConfig (uses defaults if None)

    Returns:
        TrajectoryAnalysis with quality metrics

    Example:
        >>> model, tokenizer = load_model_for_monitoring("gpt2")
        >>> analysis = analyze_trajectory(model, tokenizer, "Explain AI safety")
        >>> print(f"Passed: {analysis.passed_quality_check}")
    """
    monitor = ReasoningTrajectoryMonitor(model, tokenizer, config=config)
    return monitor.monitor_generation(prompt)

__all__ = [
    # Data structures
    "ReasoningMetrics",
    "TrajectoryAnalysis",
    "TrajectoryConfig",
    # Core monitoring (legacy)
    "ReasoningTrajectoryMonitor",
    # Convenience function
    "analyze_trajectory",
    # Production API (v2.0+)
    "HamiltonianMonitor",
    "HamiltonianEngine",
    "HamiltonianModelResource",
    # Visualization (optional, requires matplotlib)
    "HamiltonianVisualizer",
    # CERT integration
    "CERTTrajectoryAnalyzer",
    # Utilities
    "load_model_for_monitoring",
    "unload_model",
]

# Add to __all__ only if successfully imported
if HamiltonianVisualizer is None:
    __all__.remove("HamiltonianVisualizer")
