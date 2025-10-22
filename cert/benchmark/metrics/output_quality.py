"""Output quality metric implementation.

Analyzes response characteristics including length, diversity, and repetition patterns.
"""

from collections import Counter

import numpy as np
from scipy.spatial.distance import pdist
from sentence_transformers import SentenceTransformer

from ..types import OutputQualityResult
from .base import MetricBase, MetricRegistry


@MetricRegistry.register("output_quality")
class OutputQualityMetric(MetricBase):
    """Output quality metric for CERT benchmarking.

    Analyzes response patterns to assess:
    - Response length (tokens and words) - indicates completeness
    - Semantic diversity - how different are responses to different prompts
    - Repetition score - detects stuck patterns or loops

    Quality analysis helps identify:
    - Models that give too-short or too-verbose responses
    - Models with high semantic diversity (creative) vs low (deterministic)
    - Models prone to repetitive text generation
    """

    def __init__(self, config=None):
        """Initialize output quality metric.

        Args:
            config: Optional configuration with 'embedding_model' key
        """
        super().__init__(config)

        # Initialize embedding model for semantic diversity
        embedding_model = self.config.get("embedding_model", "all-MiniLM-L6-v2")
        try:
            self.embedding_model = SentenceTransformer(embedding_model)
            self.logger.info(f"Loaded embedding model: {embedding_model}")
        except Exception as e:
            self.logger.warning(f"Failed to load embedding model: {e}")
            self.embedding_model = None

    async def calculate(self, data: dict) -> OutputQualityResult:
        """Calculate output quality metrics.

        Args:
            data: Dictionary containing:
                - responses: List of response texts
                - provider: Provider name
                - model: Model identifier

        Returns:
            OutputQualityResult with quality metrics

        Raises:
            ValueError: If data is invalid or insufficient
        """
        # Validate input
        if "responses" not in data or not data["responses"]:
            raise ValueError("No response data provided")

        if "provider" not in data or "model" not in data:
            raise ValueError("Provider and model must be specified")

        responses = data["responses"]

        if len(responses) < 2:
            raise ValueError("At least 2 responses required for quality analysis")

        # Filter empty responses
        valid_responses = [r for r in responses if r and len(r.strip()) > 0]

        if len(valid_responses) < 2:
            raise ValueError("At least 2 non-empty responses required")

        # Calculate length metrics
        token_lengths = [self._count_tokens(r) for r in valid_responses]
        word_lengths = [len(r.split()) for r in valid_responses]

        mean_tokens = float(np.mean(token_lengths))
        mean_words = float(np.mean(word_lengths))
        std_tokens = float(np.std(token_lengths))
        std_words = float(np.std(word_lengths))

        # Calculate semantic diversity
        semantic_diversity = self._calculate_semantic_diversity(valid_responses)

        # Calculate repetition score
        repetition_score = self._calculate_repetition(valid_responses)

        # Create result
        result = OutputQualityResult(
            provider=data["provider"],
            model=data["model"],
            mean_output_length_tokens=mean_tokens,
            mean_output_length_words=mean_words,
            std_output_length_tokens=std_tokens,
            std_output_length_words=std_words,
            semantic_diversity_score=semantic_diversity,
            repetition_score=repetition_score,
            num_trials=len(valid_responses),
        )

        # Validate result
        if not self.validate(result):
            raise ValueError("Calculated output quality metrics failed validation")

        # Store result
        self.results.append(result)

        self.logger.info(
            f"Output Quality: {data['provider']}/{data['model']} - "
            f"mean_tokens={mean_tokens:.1f}, diversity={semantic_diversity:.3f}, "
            f"repetition={repetition_score:.3f}"
        )

        return result

    def _count_tokens(self, text: str) -> int:
        """Estimate token count (simple word-based approximation).

        Args:
            text: Input text

        Returns:
            Estimated token count
        """
        # Simple approximation: tokens ≈ words * 1.3
        # For production, use tiktoken for more accurate counts
        words = len(text.split())
        return int(words * 1.3)

    def _calculate_semantic_diversity(self, responses: list) -> float:
        """Calculate semantic diversity score.

        Higher scores indicate more diverse responses.

        Args:
            responses: List of response texts

        Returns:
            Diversity score (0-1)
        """
        if self.embedding_model is None:
            self.logger.warning(
                "Embedding model not available, returning default diversity"
            )
            return 0.5

        try:
            # Encode responses
            embeddings = self.embedding_model.encode(
                responses,
                show_progress_bar=False,
                convert_to_tensor=False,
            )

            # Calculate pairwise cosine distances
            if len(embeddings) < 2:
                return 0.0

            distances = pdist(embeddings, metric="cosine")

            # Diversity = mean distance (higher = more diverse)
            diversity = float(np.mean(distances))

            # Normalize to 0-1 range (cosine distance is 0-2, but typically 0-1)
            diversity = min(1.0, max(0.0, diversity))

            return diversity

        except Exception as e:
            self.logger.warning(f"Error calculating semantic diversity: {e}")
            return 0.5

    def _calculate_repetition(self, responses: list) -> float:
        """Calculate repetition score.

        Lower scores indicate more repetitive text (bad).
        Higher scores indicate less repetition (good).

        Args:
            responses: List of response texts

        Returns:
            Repetition score (0-1, lower = more repetitive)
        """
        try:
            # Analyze each response for internal repetition
            repetition_scores = []

            for response in responses:
                # Extract n-grams (trigrams)
                words = response.lower().split()
                if len(words) < 3:
                    repetition_scores.append(1.0)  # Too short to have repetition
                    continue

                trigrams = [" ".join(words[i : i + 3]) for i in range(len(words) - 2)]

                if not trigrams:
                    repetition_scores.append(1.0)
                    continue

                # Count repeated trigrams
                trigram_counts = Counter(trigrams)
                repeated = sum(1 for count in trigram_counts.values() if count > 1)
                total = len(trigram_counts)

                # Score: 1 - (proportion of repeated trigrams)
                score = 1.0 - (repeated / total if total > 0 else 0)
                repetition_scores.append(score)

            # Return mean repetition score
            return float(np.mean(repetition_scores))

        except Exception as e:
            self.logger.warning(f"Error calculating repetition: {e}")
            return 0.5

    def validate(self, value: OutputQualityResult) -> bool:
        """Validate output quality result.

        Args:
            value: OutputQualityResult to validate

        Returns:
            True if valid
        """
        # Length metrics must be non-negative
        if value.mean_output_length_tokens < 0:
            return False
        if value.mean_output_length_words < 0:
            return False
        if value.std_output_length_tokens < 0:
            return False
        if value.std_output_length_words < 0:
            return False

        # Scores must be in 0-1 range
        if not 0.0 <= value.semantic_diversity_score <= 1.0:
            return False
        if not 0.0 <= value.repetition_score <= 1.0:
            return False

        # Number of trials must be positive
        if value.num_trials <= 0:
            return False

        return True
