"""
Compliance module for CERT Framework.

Provides EU AI Act compliance reporting and analysis tools:
- export_report: Generate compliance reports (no extras required)
- explain_measurement_failure: Human-readable failure explanations (requires [evaluation])
- FailureExplanation: Structured explanation data (requires [evaluation])
- EvaluationDataset: Version evaluation datasets (requires [evaluation])
- EvaluationExample: Single evaluation example (requires [evaluation])
- ExperimentRun: Track experiment runs (requires [evaluation])
- run_experiment: Run evaluation experiments (requires [evaluation])
- compare_experiments: Compare multiple experiments (requires [evaluation])
"""

# Core compliance (no extras required)
from cert.compliance.reports import export_report

__all__ = [
    # Reports (always available)
    "export_report",
    # Explanations (requires [evaluation])
    "explain_measurement_failure",
    "FailureExplanation",
    # Datasets (requires [evaluation])
    "EvaluationDataset",
    "EvaluationExample",
    "create_dataset_from_audit_log",
    "merge_datasets",
    # Experiments (requires [evaluation])
    "ExperimentRun",
    "run_experiment",
    "compare_experiments",
    "load_experiments_from_directory",
]


# Lazy imports for features requiring [evaluation] extras
def __getattr__(name):
    """Lazy load evaluation-dependent features."""
    if name in [
        "explain_measurement_failure",
        "FailureExplanation",
    ]:
        try:
            from cert.compliance.explanations import (
                FailureExplanation,
                explain_measurement_failure,
            )

            return locals()[name]
        except ImportError as e:
            raise ImportError(
                f"{name} requires: pip install cert-framework[evaluation]\nOriginal error: {e}"
            )

    if name in [
        "EvaluationDataset",
        "EvaluationExample",
        "create_dataset_from_audit_log",
        "merge_datasets",
    ]:
        try:
            from cert.compliance.datasets import (
                EvaluationDataset,
                EvaluationExample,
                create_dataset_from_audit_log,
                merge_datasets,
            )

            return locals()[name]
        except ImportError as e:
            raise ImportError(
                f"{name} requires: pip install cert-framework[evaluation]\nOriginal error: {e}"
            )

    if name in [
        "ExperimentRun",
        "run_experiment",
        "compare_experiments",
        "load_experiments_from_directory",
    ]:
        try:
            from cert.compliance.experiments import (
                ExperimentRun,
                compare_experiments,
                load_experiments_from_directory,
                run_experiment,
            )

            return locals()[name]
        except ImportError as e:
            raise ImportError(
                f"{name} requires: pip install cert-framework[evaluation]\nOriginal error: {e}"
            )

    raise AttributeError(f"module 'cert.compliance' has no attribute '{name}'")
