"""Experiment tracking for CERT Framework evaluation.

Provides tools for running experiments, tracking results, and comparing
accuracy metrics across different model configurations over time.
"""

import json
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

from cert.compliance.datasets import EvaluationDataset


@dataclass
class ExperimentRun:
    """Single experiment run with results.

    Attributes:
        name: Experiment name
        timestamp: When experiment was run
        dataset_version: Version of evaluation dataset used
        model_config: Model/system configuration
        results: Aggregated metrics and failures
    """

    name: str
    timestamp: datetime
    dataset_version: str
    model_config: Dict[str, Any]
    results: Dict[str, Any]

    def save(self, path: str):
        """Save experiment run to JSON file.

        Args:
            path: File path to save experiment

        Example:
            >>> run = ExperimentRun(...)
            >>> run.save("experiments/run_2024_01_01.json")
        """
        data = {
            "name": self.name,
            "timestamp": self.timestamp.isoformat(),
            "dataset_version": self.dataset_version,
            "model_config": self.model_config,
            "results": self.results,
        }

        Path(path).parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            json.dump(data, f, indent=2)

    @classmethod
    def load(cls, path: str) -> "ExperimentRun":
        """Load experiment run from JSON file.

        Args:
            path: File path to load experiment from

        Returns:
            Loaded ExperimentRun
        """
        with open(path) as f:
            data = json.load(f)

        return cls(
            name=data["name"],
            timestamp=datetime.fromisoformat(data["timestamp"]),
            dataset_version=data["dataset_version"],
            model_config=data["model_config"],
            results=data["results"],
        )


def run_experiment(
    name: str,
    dataset: EvaluationDataset,
    eval_function: Callable[[str, str], str],
    config: Optional[Dict[str, Any]] = None,
    measure_config: Optional[Dict[str, Any]] = None,
) -> ExperimentRun:
    """Run evaluation experiment on dataset.

    Args:
        name: Experiment name
        dataset: Evaluation dataset to run on
        eval_function: Function that takes (query, context) and returns answer
        config: Configuration for eval function
        measure_config: Configuration for measure() function

    Returns:
        ExperimentRun with results

    Example:
        >>> from cert.compliance.datasets import EvaluationDataset
        >>> from cert.compliance.experiments import run_experiment
        >>>
        >>> dataset = EvaluationDataset.load("datasets/healthcare_v1.0.json")
        >>>
        >>> def my_rag_system(query, context):
        ...     # Your RAG implementation
        ...     return generate_answer(query, context)
        >>>
        >>> run = run_experiment(
        ...     name="gpt4_baseline",
        ...     dataset=dataset,
        ...     eval_function=my_rag_system,
        ...     config={"model": "gpt-4", "temperature": 0.0}
        ... )
        >>>
        >>> print(f"Pass rate: {run.results['pass_rate']:.1%}")
        >>> run.save("experiments/gpt4_baseline.json")
    """
    # Lazy load measure function (requires [evaluation] extras)
    try:
        from cert.measure.measure import measure
    except ImportError as e:
        raise ImportError(
            f"run_experiment requires: pip install cert-framework[evaluation]\nOriginal error: {e}"
        )

    results = {
        "total": len(dataset.examples),
        "passed": 0,
        "failed": 0,
        "avg_confidence": 0.0,
        "pass_rate": 0.0,
        "failures": [],
    }

    confidences = []
    measure_kwargs = measure_config or {}

    for example in dataset.examples:
        # Run eval function
        try:
            answer = eval_function(example.query, example.context)
        except Exception as e:
            # Record function failure
            results["failed"] += 1
            results["failures"].append(
                {
                    "query": example.query,
                    "error": str(e),
                    "type": "function_error",
                }
            )
            continue

        # Measure against expected answer
        measurement = measure(answer, example.expected_answer, **measure_kwargs)

        if measurement.matched:
            results["passed"] += 1
        else:
            results["failed"] += 1
            results["failures"].append(
                {
                    "query": example.query,
                    "expected": example.expected_answer,
                    "actual": answer,
                    "confidence": measurement.confidence,
                    "semantic_score": measurement.semantic_score,
                    "nli_score": getattr(measurement, "nli_score", None),
                    "type": "measurement_failure",
                }
            )

        confidences.append(measurement.confidence)

    # Calculate aggregated metrics
    if confidences:
        results["avg_confidence"] = sum(confidences) / len(confidences)
    results["pass_rate"] = results["passed"] / results["total"] if results["total"] > 0 else 0.0

    return ExperimentRun(
        name=name,
        timestamp=datetime.now(),
        dataset_version=dataset.version,
        model_config=config or {},
        results=results,
    )


def compare_experiments(
    experiments: List[ExperimentRun], output_path: str = "experiment_comparison.html"
) -> str:
    """Generate HTML comparison of experiment runs.

    Creates static HTML with tables and charts comparing metrics across experiments.

    Args:
        experiments: List of experiment runs to compare
        output_path: Path to save HTML report

    Returns:
        Path to generated HTML file

    Example:
        >>> run1 = ExperimentRun.load("experiments/gpt4_baseline.json")
        >>> run2 = ExperimentRun.load("experiments/gpt4_optimized.json")
        >>> compare_experiments([run1, run2], "comparison.html")
        'comparison.html'
    """
    html = (
        """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>CERT Experiment Comparison</title>
    <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 40px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 3px solid #003399;
            padding-bottom: 10px;
        }
        h2 {
            color: #003399;
            margin-top: 30px;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #003399;
            color: white;
            font-weight: 600;
        }
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        .chart {
            margin: 30px 0;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 10px;
        }
        .metric-good {
            color: #28a745;
            font-weight: 600;
        }
        .metric-bad {
            color: #dc3545;
            font-weight: 600;
        }
        .timestamp {
            color: #666;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>CERT Experiment Comparison</h1>
        <p class="timestamp">Generated: """
        + datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        + """</p>

        <h2>Summary</h2>
        <table>
            <tr>
                <th>Experiment</th>
                <th>Timestamp</th>
                <th>Dataset Version</th>
                <th>Total</th>
                <th>Pass Rate</th>
                <th>Avg Confidence</th>
            </tr>
"""
    )

    # Add table rows
    for exp in experiments:
        pass_rate = exp.results.get("pass_rate", 0.0)
        pass_class = "metric-good" if pass_rate >= 0.9 else "metric-bad"
        html += f"""            <tr>
                <td><strong>{exp.name}</strong></td>
                <td>{exp.timestamp.strftime("%Y-%m-%d %H:%M")}</td>
                <td>{exp.dataset_version}</td>
                <td>{exp.results["total"]}</td>
                <td class="{pass_class}">{pass_rate:.1%}</td>
                <td>{exp.results.get("avg_confidence", 0.0):.3f}</td>
            </tr>
"""

    html += """        </table>

        <h2>Pass Rate Comparison</h2>
        <div id="passRateChart" class="chart"></div>

        <h2>Confidence Score Comparison</h2>
        <div id="confidenceChart" class="chart"></div>

        <script>
"""

    # Prepare chart data
    names = [exp.name for exp in experiments]
    pass_rates = [exp.results.get("pass_rate", 0.0) * 100 for exp in experiments]
    confidences = [exp.results.get("avg_confidence", 0.0) for exp in experiments]

    html += f"""
        // Pass Rate Chart
        var passRateData = [{{
            x: {json.dumps(names)},
            y: {json.dumps(pass_rates)},
            type: 'bar',
            marker: {{
                color: {json.dumps(["#28a745" if pr >= 90 else "#dc3545" for pr in pass_rates])}
            }}
        }}];

        var passRateLayout = {{
            title: 'Pass Rate by Experiment',
            yaxis: {{
                title: 'Pass Rate (%)',
                range: [0, 100]
            }},
            xaxis: {{ title: 'Experiment' }}
        }};

        Plotly.newPlot('passRateChart', passRateData, passRateLayout);

        // Confidence Chart
        var confidenceData = [{{
            x: {json.dumps(names)},
            y: {json.dumps(confidences)},
            type: 'bar',
            marker: {{ color: '#003399' }}
        }}];

        var confidenceLayout = {{
            title: 'Average Confidence by Experiment',
            yaxis: {{
                title: 'Confidence Score',
                range: [0, 1]
            }},
            xaxis: {{ title: 'Experiment' }}
        }};

        Plotly.newPlot('confidenceChart', confidenceData, confidenceLayout);
        </script>
    </div>
</body>
</html>
"""

    with open(output_path, "w") as f:
        f.write(html)

    return output_path


def load_experiments_from_directory(directory: str) -> List[ExperimentRun]:
    """Load all experiment runs from a directory.

    Args:
        directory: Path to directory containing experiment JSON files

    Returns:
        List of loaded ExperimentRun objects

    Example:
        >>> experiments = load_experiments_from_directory("experiments/")
        >>> compare_experiments(experiments)
    """
    experiments = []
    path = Path(directory)

    if not path.exists():
        return experiments

    for file_path in path.glob("*.json"):
        try:
            exp = ExperimentRun.load(str(file_path))
            experiments.append(exp)
        except Exception as e:
            print(f"Warning: Failed to load {file_path}: {e}")

    # Sort by timestamp
    experiments.sort(key=lambda x: x.timestamp)

    return experiments
