"""Configuration for CERT agents assessment framework.

This module defines configuration dataclasses and validation logic for
agentic system assessment execution.
"""

import os
from dataclasses import dataclass, field
from typing import Dict, List

import numpy as np


@dataclass
class AssessmentConfig:
    """Configuration for agentic system assessment execution.

    Attributes:
        consistency_trials: Number of trials for consistency testing (min 10)
        performance_trials: Number of trials for performance testing (min 5)
        coordination_trials: Number of trials for coordination testing (optional)

        providers: Dict mapping provider names to list of model identifiers
                  Example: {'anthropic': ['claude-3-5-haiku-20241022']}

        embedding_model_name: Sentence transformer model for semantic similarity
        max_tokens: Maximum tokens per response
        temperature: Sampling temperature (0.0-1.0)
        timeout: Request timeout in seconds

        consistency_prompt: Prompt for consistency testing
        performance_prompts: List of prompts for performance testing

        output_dir: Directory for results and exports
        random_seed: Random seed for reproducibility

        enabled_metrics: List of metrics to run (default: core metrics only)
    """

    # Trial configurations
    consistency_trials: int = 20
    performance_trials: int = 15
    coordination_trials: int = 0  # Optional, 0 = skip

    # Model selection
    providers: Dict[str, List[str]] = field(
        default_factory=lambda: {
            "anthropic": ["claude-3-5-haiku-20241022"],
            "openai": ["gpt-4o-mini"],
            "google": ["gemini-2.0-flash-exp"],
            "xai": ["grok-2-latest"],
        }
    )

    # Embedding model for semantic similarity
    embedding_model_name: str = "all-MiniLM-L6-v2"

    # API parameters
    max_tokens: int = 1024
    temperature: float = 0.7
    timeout: int = 30

    # Test prompts
    consistency_prompt: str = (
        "Analyze the key factors in effective business strategy implementation. "
        "Provide a concise, structured response."
    )

    performance_prompts: List[str] = field(
        default_factory=lambda: [
            "Analyze the key factors in business strategy",
            "Evaluate the main considerations for project management",
            "Assess the critical elements in organizational change",
            "Identify the primary aspects of market analysis",
            "Examine the essential components of risk assessment",
        ]
    )

    # Output configuration
    output_dir: str = "./assessment_results"
    random_seed: int = 42

    # Enabled metrics (CORE metrics by default)
    enabled_metrics: List[str] = field(
        default_factory=lambda: [
            "consistency",
            "performance",
            "latency",
            "output_quality",
            "robustness",
        ]
    )

    def __post_init__(self):
        """Validate configuration after initialization."""
        # Validate trial counts
        if self.consistency_trials < 10:
            raise ValueError(
                "consistency_trials must be >= 10 for statistical significance"
            )
        if self.performance_trials < 5:
            raise ValueError("performance_trials must be >= 5")

        # Validate temperature
        if not 0.0 <= self.temperature <= 1.0:
            raise ValueError(
                f"temperature must be between 0.0 and 1.0, got {self.temperature}"
            )

        # Validate timeout
        if self.timeout <= 0:
            raise ValueError(f"timeout must be positive, got {self.timeout}")

        # Validate max_tokens
        if self.max_tokens <= 0:
            raise ValueError(f"max_tokens must be positive, got {self.max_tokens}")

        # Validate providers
        if not self.providers:
            raise ValueError("At least one provider must be configured")

        for provider, models in self.providers.items():
            if not models:
                raise ValueError(f"Provider '{provider}' has no models configured")

        # Validate enabled_metrics
        valid_metrics = {
            "consistency",
            "performance",
            "latency",
            "output_quality",
            "robustness",
            "coordination",
            "cost",
            "advanced_stats",
        }
        for metric in self.enabled_metrics:
            if metric not in valid_metrics:
                raise ValueError(
                    f"Invalid metric '{metric}'. Valid metrics: {valid_metrics}"
                )

        # Create output directory
        os.makedirs(self.output_dir, exist_ok=True)

        # Set random seed for reproducibility
        np.random.seed(self.random_seed)

    def is_metric_enabled(self, metric_name: str) -> bool:
        """Check if a metric is enabled.

        Args:
            metric_name: Name of the metric

        Returns:
            True if metric is enabled
        """
        return metric_name in self.enabled_metrics

    def get_all_model_combinations(self) -> List[tuple]:
        """Get all (provider, model) combinations to test.

        Returns:
            List of (provider_name, model_name) tuples
        """
        combinations = []
        for provider, models in self.providers.items():
            for model in models:
                combinations.append((provider, model))
        return combinations


@dataclass
class MetricConfig:
    """Configuration for individual metrics.

    Allows per-metric customization beyond global assessment config.
    """

    enabled: bool = True
    custom_params: Dict = field(default_factory=dict)

    def get_param(self, key: str, default=None):
        """Get custom parameter value.

        Args:
            key: Parameter key
            default: Default value if not found

        Returns:
            Parameter value or default
        """
        return self.custom_params.get(key, default)


# Backward compatibility alias
BenchmarkConfig = AssessmentConfig
