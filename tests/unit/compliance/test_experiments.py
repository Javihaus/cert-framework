"""Tests for compliance experiments module."""

from datetime import datetime
from pathlib import Path

import pytest

from cert.compliance.datasets import EvaluationDataset, EvaluationExample
from cert.compliance.experiments import (
    ExperimentRun,
    compare_experiments,
    load_experiments_from_directory,
    run_experiment,
)

# Check if evaluation dependencies are available
try:
    from sentence_transformers import SentenceTransformer  # noqa: F401

    EVALUATION_DEPS_AVAILABLE = True
except ImportError:
    EVALUATION_DEPS_AVAILABLE = False

requires_evaluation = pytest.mark.skipif(
    not EVALUATION_DEPS_AVAILABLE, reason="Evaluation dependencies not available"
)


def test_experiment_run_creation():
    """Test creating an experiment run."""
    run = ExperimentRun(
        name="test_experiment",
        timestamp=datetime.now(),
        dataset_version="1.0",
        model_config={"model": "gpt-4", "temperature": 0.0},
        results={"total": 10, "passed": 8, "failed": 2, "pass_rate": 0.8},
    )

    assert run.name == "test_experiment"
    assert run.dataset_version == "1.0"
    assert run.model_config["model"] == "gpt-4"
    assert run.results["pass_rate"] == 0.8


def test_experiment_run_save_and_load(tmp_path):
    """Test saving and loading experiment runs."""
    original = ExperimentRun(
        name="test",
        timestamp=datetime.now(),
        dataset_version="1.0",
        model_config={"model": "test"},
        results={"total": 5, "passed": 4},
    )

    # Save
    file_path = tmp_path / "test_run.json"
    original.save(str(file_path))

    # Verify file exists
    assert file_path.exists()

    # Load
    loaded = ExperimentRun.load(str(file_path))

    assert loaded.name == original.name
    assert loaded.dataset_version == original.dataset_version
    assert loaded.model_config == original.model_config
    assert loaded.results == original.results


@requires_evaluation
def test_run_experiment_basic():
    """Test running a basic experiment."""
    # Create test dataset
    dataset = EvaluationDataset(
        name="test",
        version="1.0",
        created_at=datetime.now(),
        examples=[
            EvaluationExample(query="What is 2+2?", context="Basic math", expected_answer="4"),
            EvaluationExample(query="What is 3+3?", context="Basic math", expected_answer="6"),
        ],
    )

    # Simple eval function that always returns correct answer
    def perfect_eval(query, context):
        if "2+2" in query:
            return "4"
        elif "3+3" in query:
            return "6"
        return "unknown"

    # Run experiment
    run = run_experiment(
        name="perfect_test",
        dataset=dataset,
        eval_function=perfect_eval,
        config={"model": "test"},
    )

    assert run.name == "perfect_test"
    assert run.dataset_version == "1.0"
    assert run.results["total"] == 2
    assert run.results["passed"] == 2
    assert run.results["failed"] == 0
    assert run.results["pass_rate"] == 1.0


@requires_evaluation
def test_run_experiment_with_failures():
    """Test experiment with some failures."""
    dataset = EvaluationDataset(
        name="test",
        version="1.0",
        created_at=datetime.now(),
        examples=[
            EvaluationExample(query="What is 2+2?", context="Math", expected_answer="4"),
            EvaluationExample(query="What is 3+3?", context="Math", expected_answer="6"),
        ],
    )

    # Eval function that gets one wrong
    def imperfect_eval(query, context):
        if "2+2" in query:
            return "4"  # Correct
        elif "3+3" in query:
            return "7"  # Wrong
        return "unknown"

    run = run_experiment(name="imperfect_test", dataset=dataset, eval_function=imperfect_eval)

    assert run.results["total"] == 2
    assert run.results["passed"] == 1
    assert run.results["failed"] == 1
    assert run.results["pass_rate"] == 0.5
    assert len(run.results["failures"]) == 1
    assert run.results["failures"][0]["type"] == "measurement_failure"


@requires_evaluation
def test_run_experiment_with_function_error():
    """Test experiment where eval function raises error."""
    dataset = EvaluationDataset(
        name="test",
        version="1.0",
        created_at=datetime.now(),
        examples=[EvaluationExample(query="Test", context="Context", expected_answer="Answer")],
    )

    # Eval function that raises error
    def broken_eval(query, context):
        raise ValueError("Intentional error")

    run = run_experiment(name="error_test", dataset=dataset, eval_function=broken_eval)

    assert run.results["total"] == 1
    assert run.results["passed"] == 0
    assert run.results["failed"] == 1
    assert len(run.results["failures"]) == 1
    assert run.results["failures"][0]["type"] == "function_error"
    assert "Intentional error" in run.results["failures"][0]["error"]


@requires_evaluation
def test_run_experiment_calculates_avg_confidence():
    """Test that average confidence is calculated correctly."""
    dataset = EvaluationDataset(
        name="test",
        version="1.0",
        created_at=datetime.now(),
        examples=[
            EvaluationExample(query="Q1", context="C1", expected_answer="Similar text here"),
            EvaluationExample(query="Q2", context="C2", expected_answer="Different text"),
        ],
    )

    def eval_fn(query, context):
        if "Q1" in query:
            return "Similar text here"  # High confidence
        return "Completely different"  # Low confidence

    run = run_experiment(name="confidence_test", dataset=dataset, eval_function=eval_fn)

    assert "avg_confidence" in run.results
    assert 0.0 <= run.results["avg_confidence"] <= 1.0


def test_compare_experiments_html_generation(tmp_path):
    """Test generating HTML comparison report."""
    run1 = ExperimentRun(
        name="experiment_1",
        timestamp=datetime.now(),
        dataset_version="1.0",
        model_config={},
        results={
            "total": 10,
            "passed": 8,
            "failed": 2,
            "pass_rate": 0.8,
            "avg_confidence": 0.85,
        },
    )

    run2 = ExperimentRun(
        name="experiment_2",
        timestamp=datetime.now(),
        dataset_version="1.0",
        model_config={},
        results={
            "total": 10,
            "passed": 9,
            "failed": 1,
            "pass_rate": 0.9,
            "avg_confidence": 0.92,
        },
    )

    output_path = tmp_path / "comparison.html"
    result_path = compare_experiments([run1, run2], str(output_path))

    assert Path(result_path).exists()

    # Read and verify HTML content
    with open(result_path) as f:
        html = f.read()

    assert "experiment_1" in html
    assert "experiment_2" in html
    assert "80.0%" in html  # Pass rate for run1
    assert "90.0%" in html  # Pass rate for run2
    assert "Plotly" in html  # Chart library included


def test_load_experiments_from_directory(tmp_path):
    """Test loading all experiments from a directory."""
    # Create test experiments
    run1 = ExperimentRun(
        name="exp1",
        timestamp=datetime(2024, 1, 1),
        dataset_version="1.0",
        model_config={},
        results={},
    )

    run2 = ExperimentRun(
        name="exp2",
        timestamp=datetime(2024, 1, 2),
        dataset_version="1.0",
        model_config={},
        results={},
    )

    # Save both
    run1.save(str(tmp_path / "exp1.json"))
    run2.save(str(tmp_path / "exp2.json"))

    # Also create a non-JSON file that should be ignored
    (tmp_path / "readme.txt").write_text("This is not an experiment")

    # Load all
    experiments = load_experiments_from_directory(str(tmp_path))

    assert len(experiments) == 2
    assert experiments[0].name == "exp1"  # Should be sorted by timestamp
    assert experiments[1].name == "exp2"


def test_load_experiments_from_nonexistent_directory():
    """Test loading from a directory that doesn't exist."""
    experiments = load_experiments_from_directory("/nonexistent/directory")
    assert experiments == []


@requires_evaluation
def test_experiment_with_custom_measure_config():
    """Test running experiment with custom measure configuration."""
    dataset = EvaluationDataset(
        name="test",
        version="1.0",
        created_at=datetime.now(),
        examples=[EvaluationExample(query="Test", context="Context", expected_answer="Answer")],
    )

    def eval_fn(query, context):
        return "Answer"

    # Run with custom measure config
    run = run_experiment(
        name="custom_config_test",
        dataset=dataset,
        eval_function=eval_fn,
        measure_config={"threshold": 0.5},
    )

    # Should still complete successfully
    assert run.results["total"] == 1


@requires_evaluation
def test_empty_dataset_experiment():
    """Test running experiment on empty dataset."""
    dataset = EvaluationDataset(name="empty", version="1.0", created_at=datetime.now(), examples=[])

    def eval_fn(query, context):
        return "result"

    run = run_experiment(name="empty_test", dataset=dataset, eval_function=eval_fn)

    assert run.results["total"] == 0
    assert run.results["passed"] == 0
    assert run.results["failed"] == 0
    assert run.results["pass_rate"] == 0.0
    assert run.results["avg_confidence"] == 0.0
