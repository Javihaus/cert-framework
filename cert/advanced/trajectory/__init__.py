"""
Reasoning Trajectory Monitor for CERT Framework.

⚠️ EXPERIMENTAL RESEARCH TOOL ⚠️

This module provides per-token perplexity and entropy tracking for LLM generation
quality monitoring. It is NOT optimized for production scale.

WHAT THIS IS:
- Research tool for trajectory analysis
- Per-token metrics (perplexity, entropy, surprise)
- Quality threshold detection
- Useful for debugging and model evaluation

WHAT THIS IS NOT:
- Production monitoring system (use cert.monitor instead)
- High-throughput analysis (no batch optimization)
- GPU-optimized (runs on whatever torch defaults to)

PERFORMANCE CHARACTERISTICS:
- Model loading: 5-30 seconds (depends on model size)
- Analysis per prompt: 1-10 seconds (depends on generation length)
- Memory: ~500MB-4GB (depends on model)
- Recommended for: Offline analysis, debugging, research
- Not recommended for: Real-time monitoring, high-throughput serving

For production accuracy monitoring, use:
    from cert import measure, monitor

Author: Javier Marín
Version: 2.0.0 (Experimental)
License: MIT
"""

__version__ = "2.0.0"

# All trajectory features require torch (part of [evaluation] extras)
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


def __getattr__(name):
    """Lazy load trajectory features (requires torch)."""
    if name in [
        "ReasoningTrajectoryMonitor",
        "analyze_trajectory",
    ]:
        try:
            from cert.advanced.trajectory.monitor import ReasoningTrajectoryMonitor

            if name == "ReasoningTrajectoryMonitor":
                return ReasoningTrajectoryMonitor
            elif name == "analyze_trajectory":
                # Define analyze_trajectory locally
                def analyze_trajectory(model, tokenizer, prompt: str, config=None):
                    """Analyze a single generation with trajectory monitoring."""
                    from cert.advanced.trajectory.types import TrajectoryConfig

                    monitor = ReasoningTrajectoryMonitor(model, tokenizer, config=config)
                    return monitor.monitor_generation(prompt)

                return analyze_trajectory
        except ImportError as e:
            raise ImportError(
                f"{name} requires: pip install cert-framework[evaluation]\nOriginal error: {e}"
            )

    if name in ["ReasoningMetrics", "TrajectoryAnalysis", "TrajectoryConfig"]:
        try:
            from cert.advanced.trajectory.types import (
                ReasoningMetrics,
                TrajectoryAnalysis,
                TrajectoryConfig,
            )

            return locals()[name]
        except ImportError as e:
            raise ImportError(
                f"{name} requires: pip install cert-framework[evaluation]\nOriginal error: {e}"
            )

    if name == "HamiltonianVisualizer":
        try:
            from cert.advanced.trajectory.visualizer import HamiltonianVisualizer

            return HamiltonianVisualizer
        except ImportError as e:
            raise ImportError(
                f"{name} requires: pip install cert-framework[evaluation,trajectory]\n"
                f"Matplotlib is required for visualization.\n"
                f"Original error: {e}"
            )

    if name == "CERTTrajectoryAnalyzer":
        try:
            from cert.advanced.trajectory.analyzer import CERTTrajectoryAnalyzer

            return CERTTrajectoryAnalyzer
        except ImportError as e:
            raise ImportError(
                f"{name} requires: pip install cert-framework[evaluation]\nOriginal error: {e}"
            )

    if name in ["HamiltonianMonitor", "HamiltonianEngine", "HamiltonianModelResource"]:
        try:
            from cert.advanced.trajectory.api import HamiltonianMonitor
            from cert.advanced.trajectory.engine import HamiltonianEngine
            from cert.advanced.trajectory.resources import HamiltonianModelResource

            return locals()[name]
        except ImportError as e:
            raise ImportError(
                f"{name} requires: pip install cert-framework[evaluation]\nOriginal error: {e}"
            )

    if name in ["load_model_for_monitoring", "unload_model"]:
        try:
            from cert.advanced.trajectory.utils import (
                load_model_for_monitoring,
                unload_model,
            )

            return locals()[name]
        except ImportError as e:
            raise ImportError(
                f"{name} requires: pip install cert-framework[evaluation]\nOriginal error: {e}"
            )

    raise AttributeError(f"module 'cert.advanced.trajectory' has no attribute '{name}'")
