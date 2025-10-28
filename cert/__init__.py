"""
CERT Framework v2.0.0
======================

EU AI Act Article 15 Compliance Framework for LLM Systems

Production-ready accuracy monitoring with automated compliance documentation.

Public API:
    - measure(): Measure consistency between two texts
    - monitor(): Decorator for monitoring LLM outputs
    - export_report(): Generate EU AI Act compliance reports
    - PRESETS: Industry preset configurations

Example Usage:
    >>> from cert import measure, monitor, export_report
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
    ...     return {"context": context, "answer": answer}

Advanced Features (Experimental):
    For trajectory analysis and coordination monitoring, use:
    >>> from cert.advanced.trajectory import analyze_trajectory
    >>> from cert.advanced.coordination import CoordinationOrchestrator

For detailed documentation, see: https://github.com/Javihaus/cert-framework
"""

__version__ = "2.0.0"
__author__ = "Javier Marin"
__license__ = "MIT"

# Public API - Production-ready monitoring
from cert.measure import measure
from cert.monitor import monitor
from cert.compliance import export_report
from cert.utils import (
    Preset,
    PRESETS,
    IndustryPreset,
    ComplianceRequirement,
    INDUSTRY_PRESETS,
    get_industry_preset,
)

__all__ = [
    # Core API
    "measure",
    "monitor",
    "export_report",
    # Presets (legacy)
    "Preset",
    "PRESETS",
    # Enhanced presets with EU AI Act compliance mapping
    "IndustryPreset",
    "ComplianceRequirement",
    "INDUSTRY_PRESETS",
    "get_industry_preset",
]


# Deprecation warnings for v1.x imports
def __getattr__(name):
    """Handle deprecated imports with warnings."""
    import warnings

    # Trajectory imports moved to advanced
    if name in [
        "analyze_trajectory",
        "CERTTrajectoryAnalyzer",
        "TrajectoryConfig",
        "TrajectoryAnalysis",
        "load_model_for_monitoring",
        "unload_model",
        "HamiltonianVisualizer",
    ]:
        warnings.warn(
            f"Importing '{name}' from cert is deprecated. "
            f"Use: from cert.advanced.trajectory import {name}",
            DeprecationWarning,
            stacklevel=2,
        )

        # Import from new location
        if name == "analyze_trajectory":
            # Provide convenience function
            def analyze_trajectory(model, tokenizer, prompt: str, config=None):
                """
                Analyze a single generation with trajectory monitoring.

                DEPRECATED: Import from cert.advanced.trajectory instead.
                """
                from cert.advanced.trajectory import ReasoningTrajectoryMonitor

                monitor = ReasoningTrajectoryMonitor(model, tokenizer, config=config)
                return monitor.monitor_generation(prompt)

            return analyze_trajectory
        else:
            # Import other trajectory components
            from cert.advanced import trajectory

            return getattr(trajectory, name)

    # Coordination imports moved to advanced
    if name in ["CoordinationOrchestrator", "CoordinationMetrics", "QualityEvaluator"]:
        warnings.warn(
            f"Importing '{name}' from cert is deprecated. "
            f"Use: from cert.advanced.coordination import {name}",
            DeprecationWarning,
            stacklevel=2,
        )
        from cert.advanced import coordination

        return getattr(coordination, name)

    raise AttributeError(f"module 'cert' has no attribute '{name}'")
