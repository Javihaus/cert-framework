"""Performance metric implementation (ported from notebook)."""

import numpy as np
from sentence_transformers import SentenceTransformer

from ..types import PerformanceResult
from .base import MetricBase, MetricRegistry


@MetricRegistry.register("performance")
class PerformanceMetric(MetricBase):
    """Performance metric measuring output quality across prompts."""

    def __init__(self, config=None):
        super().__init__(config)
        embedding_model = self.config.get("embedding_model", "all-MiniLM-L6-v2")
        self.embedding_model = SentenceTransformer(embedding_model)

    async def calculate(self, data: dict) -> PerformanceResult:
        """Calculate performance scores.

        Args:
            data: Dict with 'prompt_response_pairs', 'provider', 'model'
                  where prompt_response_pairs is list of (prompt, response) tuples

        Returns:
            PerformanceResult
        """
        pairs = data.get("prompt_response_pairs", [])
        if not pairs:
            raise ValueError("No prompt-response pairs provided")

        scores = [self._score_response(prompt, response) for prompt, response in pairs]

        mean_score = float(np.mean(scores))
        std_score = float(np.std(scores))
        min_score = float(np.min(scores))
        max_score = float(np.max(scores))

        result = PerformanceResult(
            provider=data["provider"],
            model=data["model"],
            mean_score=mean_score,
            std_score=std_score,
            min_score=min_score,
            max_score=max_score,
            num_trials=len(scores),
        )

        self.results.append(result)
        self.logger.info(
            f"Performance: {data['provider']}/{data['model']} = {mean_score:.3f}"
        )
        return result

    def _score_response(self, prompt: str, response: str) -> float:
        """Score response quality (0-1)."""
        if not response or len(response.strip()) < 10:
            return 0.0

        # Semantic relevance (50%)
        prompt_emb = self.embedding_model.encode(prompt, show_progress_bar=False)
        response_emb = self.embedding_model.encode(response, show_progress_bar=False)
        relevance = float(
            np.dot(prompt_emb, response_emb)
            / (np.linalg.norm(prompt_emb) * np.linalg.norm(response_emb))
        )
        relevance = (relevance + 1) / 2  # Normalize [-1,1] to [0,1]

        # Completeness (30%)
        word_count = len(response.split())
        completeness = min(1.0, word_count / 200)

        # Structure (20%)
        has_structure = 1.0 if any(c in response for c in [".", "\n", ":"]) else 0.5

        score = relevance * 0.5 + completeness * 0.3 + has_structure * 0.2
        return float(score)

    def validate(self, value: PerformanceResult) -> bool:
        return (
            0.0 <= value.mean_score <= 1.0
            and 0.0 <= value.std_score
            and 0.0 <= value.min_score <= value.mean_score <= value.max_score <= 1.0
            and value.num_trials > 0
        )
