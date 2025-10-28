"""
Compliance module for CERT Framework.

Provides EU AI Act compliance reporting and analysis tools:
- export_report: Generate compliance reports
- explain_measurement_failure: Human-readable failure explanations
- FailureExplanation: Structured explanation data
- EvaluationDataset: Version evaluation datasets
- EvaluationExample: Single evaluation example
- ExperimentRun: Track experiment runs
- run_experiment: Run evaluation experiments
- compare_experiments: Compare multiple experiments
"""

from cert.compliance.reports import export_report
from cert.compliance.explanations import (
    explain_measurement_failure,
    FailureExplanation,
)
from cert.compliance.datasets import (
    EvaluationDataset,
    EvaluationExample,
    create_dataset_from_audit_log,
    merge_datasets,
)
from cert.compliance.experiments import (
    ExperimentRun,
    run_experiment,
    compare_experiments,
    load_experiments_from_directory,
)

__all__ = [
    # Reports
    "export_report",
    # Explanations
    "explain_measurement_failure",
    "FailureExplanation",
    # Datasets
    "EvaluationDataset",
    "EvaluationExample",
    "create_dataset_from_audit_log",
    "merge_datasets",
    # Experiments
    "ExperimentRun",
    "run_experiment",
    "compare_experiments",
    "load_experiments_from_directory",
]
