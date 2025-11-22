"""
CERT Framework v4.0.0
======================

EU AI Act Article 15 Compliance Framework for LLM Systems

Production-ready accuracy monitoring with automated compliance documentation.

Public API:
    - trace(): Lightweight decorator for logging (zero dependencies)
    - measure(): Measure consistency between two texts (requires [evaluation])
    - monitor(): Decorator for monitoring LLM outputs (DEPRECATED, use trace())
    - export_report(): Generate EU AI Act compliance reports (requires [compliance])
    - PRESETS: Industry preset configurations

New Modules (v4.0.0):
    - cert.monitoring: Production LLM monitoring (drift, latency, feedback)
    - cert.compliance_2025: EU AI Act 2025 compliance (risk classification, GPAI, audit)
    - cert.observability: Telemetry, visualization, and alerting

Example Usage:
    >>> from cert import trace
    >>>
    >>> # Basic tracing (zero dependencies)
    >>> @trace()
    ... def my_rag_pipeline(query):
    ...     context = retrieve(query)
    ...     answer = llm(context, query)
    ...     return {"context": context, "answer": answer}
    >>>
    >>> # For evaluation features:
    >>> # pip install cert-framework[evaluation]
    >>> from cert import measure
    >>> result = measure(
    ...     text1="Revenue was $5M in Q4",
    ...     text2="Q4 revenue reached $5M"
    ... )
    >>>
    >>> # For EU AI Act 2025 compliance:
    >>> from cert.compliance_2025 import AIActRiskClassifier
    >>> classifier = AIActRiskClassifier()
    >>> assessment = classifier.classify("HR Screening AI", domain="employment")
    >>>
    >>> # For production monitoring:
    >>> from cert.monitoring import EmbeddingDriftMonitor, LatencyTracker
    >>> drift_monitor = EmbeddingDriftMonitor()
    >>> latency_tracker = LatencyTracker()

Advanced Features (Experimental):
    For trajectory analysis and coordination monitoring, use:
    >>> from cert.advanced.trajectory import analyze_trajectory
    >>> from cert.advanced.coordination import CoordinationOrchestrator

For detailed documentation, see: https://github.com/Javihaus/cert-framework
"""

__version__ = "4.0.0"
__author__ = "Javier Marin"
__license__ = "Apache 2.0"

# Core API - Always available (zero dependencies)
from cert.core.tracer import trace


# Lazy imports for optional features
def measure(*args, **kwargs):
    """Measure consistency between two texts.

    Requires: pip install cert-framework[evaluation]
    """
    try:
        from cert.measure import measure as _measure

        return _measure(*args, **kwargs)
    except ImportError as e:
        raise ImportError(
            "Evaluation features require: pip install cert-framework[evaluation]\n"
            f"Original error: {e}"
        )


def monitor(*args, **kwargs):
    """Monitor LLM function for accuracy (DEPRECATED).

    DEPRECATED: Use trace() for lightweight monitoring.
    For evaluation, use trace() + Evaluator.evaluate_log_file()

    Requires: pip install cert-framework[evaluation]
    """
    import warnings

    warnings.warn(
        "monitor() is deprecated. Use trace() for monitoring. "
        "For evaluation, use: Evaluator.evaluate_log_file()",
        DeprecationWarning,
        stacklevel=2,
    )
    try:
        from cert.monitor import monitor as _monitor

        return _monitor(*args, **kwargs)
    except ImportError as e:
        raise ImportError(
            f"Monitor requires: pip install cert-framework[evaluation]\nOriginal error: {e}"
        )


def export_report(*args, **kwargs):
    """Generate EU AI Act compliance report.

    Requires: pip install cert-framework[compliance]
    """
    try:
        from cert.compliance import export_report as _export_report

        return _export_report(*args, **kwargs)
    except ImportError as e:
        raise ImportError(
            "Compliance reporting requires: pip install cert-framework[compliance]\n"
            f"Original error: {e}"
        )


# Lazy preset imports
def _get_presets():
    """Lazy load presets."""
    try:
        from cert.utils import (
            INDUSTRY_PRESETS,
            PRESETS,
            ComplianceRequirement,
            IndustryPreset,
            Preset,
            get_industry_preset,
        )

        return {
            "Preset": Preset,
            "PRESETS": PRESETS,
            "IndustryPreset": IndustryPreset,
            "ComplianceRequirement": ComplianceRequirement,
            "INDUSTRY_PRESETS": INDUSTRY_PRESETS,
            "get_industry_preset": get_industry_preset,
        }
    except ImportError:
        return None


__all__ = [
    # Core API (always available)
    "trace",
    # Optional features (lazy loaded)
    "measure",
    "monitor",
    "export_report",
    # Presets
    "Preset",
    "PRESETS",
    "IndustryPreset",
    "ComplianceRequirement",
    "INDUSTRY_PRESETS",
    "get_industry_preset",
]


# Deprecation warnings for v1.x imports
def __getattr__(name):
    """Handle deprecated imports and lazy preset loading."""
    import warnings

    # Lazy load presets
    if name in [
        "Preset",
        "PRESETS",
        "IndustryPreset",
        "ComplianceRequirement",
        "INDUSTRY_PRESETS",
        "get_industry_preset",
    ]:
        presets = _get_presets()
        if presets and name in presets:
            return presets[name]
        else:
            raise ImportError("Preset utilities require: pip install cert-framework[evaluation]")

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
