"""
Data structures for Reasoning Trajectory Monitor.

MARKETING: "Hamiltonian trajectory state variables"
TECHNICAL: Per-token confidence metrics with quality thresholds
"""

from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import List, Dict


@dataclass
class ReasoningMetrics:
    """
    Per-step metrics for generation monitoring.

    Technical: These measure token prediction confidence
    Marketing: "Reasoning trajectory state variables"
    """
    step: int
    token: str
    perplexity: float
    top_k_entropy: float  # Distribution spread
    logit_gap: float      # Top-2 confidence difference
    cumulative_surprise: float  # Running sum of low-prob tokens

    def to_dict(self) -> Dict:
        """Convert to dictionary for serialization."""
        return asdict(self)


@dataclass
class TrajectoryAnalysis:
    """
    Complete analysis results for a generation.

    Marketing: "Hamiltonian trajectory quality assessment"
    Reality: "Confidence metrics with pass/fail thresholds"
    """
    model_name: str
    prompt: str
    generated_text: str
    metrics: List[ReasoningMetrics]
    passed_quality_check: bool

    # Summary statistics
    avg_perplexity: float
    max_perplexity: float
    avg_entropy: float
    max_entropy: float
    final_surprise: float
    generation_steps: int

    # Thresholds used
    perplexity_threshold: float
    entropy_threshold: float
    surprise_threshold: float

    # Metadata
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict:
        """Convert to dictionary for export."""
        return {
            'model_name': self.model_name,
            'prompt': self.prompt,
            'generated_text': self.generated_text,
            'passed_quality_check': self.passed_quality_check,
            'summary': {
                'avg_perplexity': self.avg_perplexity,
                'max_perplexity': self.max_perplexity,
                'avg_entropy': self.avg_entropy,
                'max_entropy': self.max_entropy,
                'final_surprise': self.final_surprise,
                'generation_steps': self.generation_steps
            },
            'thresholds': {
                'perplexity': self.perplexity_threshold,
                'entropy': self.entropy_threshold,
                'surprise': self.surprise_threshold
            },
            'metrics': [m.to_dict() for m in self.metrics],
            'timestamp': self.timestamp
        }


@dataclass
class TrajectoryConfig:
    """Configuration for trajectory monitoring."""

    # Quality thresholds (tune per use case)
    perplexity_threshold: float = 50.0  # Higher = more uncertain
    entropy_threshold: float = 2.5       # Higher = more scattered
    surprise_threshold: float = 10.0     # Cumulative surprise budget

    # Generation parameters
    max_new_tokens: int = 150
    temperature: float = 0.7
    top_k: int = 10  # For entropy calculation

    # Surprise detection
    surprise_probability_threshold: float = 0.1  # Tokens below this are "surprising"

    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return asdict(self)
