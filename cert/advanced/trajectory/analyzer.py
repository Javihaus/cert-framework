"""
CERT Framework integration wrapper for trajectory monitoring.

This provides the clean API for using trajectory monitoring
as part of the CERT platform's Trustworthiness dimension.
"""

import numpy as np
import json
import os
from datetime import datetime
from typing import List, Dict

from cert.advanced.trajectory.monitor import ReasoningTrajectoryMonitor
from cert.advanced.trajectory.types import TrajectoryAnalysis, TrajectoryConfig


class CERTTrajectoryAnalyzer:
    """
    Integration wrapper for CERT Framework.

    This class provides the interface for using trajectory monitoring
    as Tool #6 in the CERT platform.
    """

    def __init__(self, config: TrajectoryConfig = None):
        """Initialize analyzer with config."""
        self.config = config or TrajectoryConfig()
        self.monitors = {}  # Cache monitors per model

    def analyze_model(
        self, model, tokenizer, test_prompts: List[str], device: str = "cuda"
    ) -> Dict[str, TrajectoryAnalysis]:
        """
        Analyze a model across multiple test prompts.

        Args:
            model: HuggingFace model
            tokenizer: Corresponding tokenizer
            test_prompts: List of prompts to test
            device: 'cuda' or 'cpu'

        Returns:
            Dictionary mapping prompt to TrajectoryAnalysis
        """
        model_id = model.config._name_or_path

        # Create or retrieve monitor
        if model_id not in self.monitors:
            self.monitors[model_id] = ReasoningTrajectoryMonitor(
                model=model, tokenizer=tokenizer, config=self.config, device=device
            )

        monitor = self.monitors[model_id]

        # Run analysis on each prompt
        results = {}
        for prompt in test_prompts:
            analysis = monitor.monitor_generation(prompt)
            results[prompt] = analysis

        return results

    def get_summary_statistics(
        self, results: Dict[str, TrajectoryAnalysis]
    ) -> Dict[str, float]:
        """
        Calculate aggregate statistics across multiple analyses.

        Args:
            results: Dictionary of TrajectoryAnalysis results

        Returns:
            Summary statistics dictionary
        """
        analyses = list(results.values())

        return {
            "pass_rate": sum(a.passed_quality_check for a in analyses) / len(analyses),
            "avg_perplexity": np.mean([a.avg_perplexity for a in analyses]),
            "avg_entropy": np.mean([a.avg_entropy for a in analyses]),
            "avg_surprise": np.mean([a.final_surprise for a in analyses]),
            "total_tests": len(analyses),
            "passed_tests": sum(a.passed_quality_check for a in analyses),
            "failed_tests": sum(not a.passed_quality_check for a in analyses),
        }

    def export_results(
        self, results: Dict[str, TrajectoryAnalysis], output_dir: str, model_name: str
    ) -> None:
        """
        Export results in CERT-compatible format.

        Args:
            results: Dictionary of TrajectoryAnalysis results
            output_dir: Directory to save results
            model_name: Name of model for file naming
        """
        os.makedirs(output_dir, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_model_name = model_name.replace("/", "_")

        # Export JSON
        json_path = os.path.join(
            output_dir, f"trajectory_analysis_{safe_model_name}_{timestamp}.json"
        )
        with open(json_path, "w") as f:
            json.dump(
                {prompt: analysis.to_dict() for prompt, analysis in results.items()},
                f,
                indent=2,
            )
        print(f"Results exported to: {json_path}")

        # Export summary statistics
        summary = self.get_summary_statistics(results)
        summary_path = os.path.join(
            output_dir, f"trajectory_summary_{safe_model_name}_{timestamp}.json"
        )
        with open(summary_path, "w") as f:
            json.dump(summary, f, indent=2)
        print(f"Summary exported to: {summary_path}")
