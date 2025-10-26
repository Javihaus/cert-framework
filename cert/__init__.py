"""
CERT Framework v3.1.0
======================

EU AI Act Article 15 Compliance Framework for LLM Systems

Comprehensive platform with 6 integrated tools for AI quality assurance:
- Consistency measurement (measure)
- Continuous monitoring (monitor)
- Trajectory analysis (analyze_trajectory)
- Compliance reporting (export_report)
- Industry presets (Preset, PRESETS)

Public API:
    - measure(): Measure consistency between two texts
    - monitor(): Decorator for monitoring LLM outputs
    - analyze_trajectory(): Real-time LLM generation quality monitoring
    - export_report(): Generate EU AI Act compliance reports
    - Preset: Industry preset configurations
    - PRESETS: Available preset definitions

Example Usage:
    >>> from cert import measure, monitor, analyze_trajectory
    >>>
    >>> # Measure consistency
    >>> result = measure(
    ...     text1="Revenue was $5M in Q4",
    ...     text2="Q4 revenue reached $5M"
    ... )
    >>> print(f"Confidence: {result.confidence}")
    >>>
    >>> # Monitor with preset
    >>> @monitor(preset="healthcare")
    ... def my_rag_pipeline(query):
    ...     context = retrieve(query)
    ...     answer = llm(context, query)
    ...     return answer
    >>>
    >>> # Analyze reasoning trajectory
    >>> from cert.trajectory import load_model_for_monitoring, TrajectoryConfig
    >>> model, tokenizer = load_model_for_monitoring("model-name")
    >>> analysis = analyze_trajectory(model, tokenizer, "Your prompt here")
    >>> print(f"Quality: {'PASSED' if analysis.passed_quality_check else 'FAILED'}")

For detailed documentation, see: https://github.com/Javihaus/cert-framework
"""

__version__ = "3.1.0"
__author__ = "Javier Marin"
__license__ = "MIT"

# Public API - This is all users need to import
from cert.measure import measure
from cert.monitor import monitor
from cert.utils import Preset, PRESETS, export_report

# Trajectory monitoring (Tool #6 - NEW in v3.1.0)
from cert.trajectory import (
    CERTTrajectoryAnalyzer,
    TrajectoryConfig,
    TrajectoryAnalysis,
    load_model_for_monitoring,
    unload_model,
)

# Optional visualization (requires matplotlib)
try:
    from cert.trajectory import HamiltonianVisualizer
except (ImportError, AttributeError):
    HamiltonianVisualizer = None


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
        >>> model, tokenizer = load_model_for_monitoring("Qwen/Qwen2.5-7B")
        >>> analysis = analyze_trajectory(model, tokenizer, "Explain AI safety")
        >>> print(f"Passed: {analysis.passed_quality_check}")
    """
    from cert.trajectory import ReasoningTrajectoryMonitor

    monitor = ReasoningTrajectoryMonitor(model, tokenizer, config=config)
    return monitor.monitor_generation(prompt)


__all__ = [
    # v3.0 API
    "measure",
    "monitor",
    "Preset",
    "PRESETS",
    "export_report",
    # v3.1.0 API - Trajectory monitoring
    "analyze_trajectory",
    "CERTTrajectoryAnalyzer",
    "TrajectoryConfig",
    "TrajectoryAnalysis",
    "HamiltonianVisualizer",
    "load_model_for_monitoring",
    "unload_model",
]

# Remove HamiltonianVisualizer from __all__ if matplotlib is not available
if HamiltonianVisualizer is None:
    __all__.remove("HamiltonianVisualizer")
