"""Consistency metric implementation (ported from notebook)."""

import numpy as np
from scipy.spatial.distance import pdist
from sentence_transformers import SentenceTransformer

from ..types import ConsistencyResult
from .base import MetricBase, MetricRegistry


@MetricRegistry.register("consistency")
class ConsistencyMetric(MetricBase):
    """Consistency metric measuring behavioral reliability across trials."""

    def __init__(self, config=None):
        super().__init__(config)
        embedding_model = self.config.get("embedding_model", "all-MiniLM-L6-v2")
        self.embedding_model = SentenceTransformer(embedding_model)

    async def calculate(self, data: dict) -> ConsistencyResult:
        """Calculate consistency score from responses.

        Args:
            data: Dict with 'responses', 'provider', 'model'

        Returns:
            ConsistencyResult
        """
        if "responses" not in data:
            raise ValueError("At least 2 valid responses required")

        responses = data["responses"]
        valid_responses = [r for r in responses if r and len(r.strip()) > 0]

        if len(valid_responses) < 2:
            raise ValueError("At least 2 valid responses required")

        embeddings = self.embedding_model.encode(
            valid_responses, show_progress_bar=False, convert_to_tensor=False
        )

        distances = pdist(embeddings, metric="cosine")
        mean_distance = float(np.mean(distances))
        std_distance = float(np.std(distances))

        # Consistency: 1 - (std/mean), bounded [0,1]
        if mean_distance == 0:
            consistency = 1.0
        else:
            consistency = max(0.0, min(1.0, 1.0 - (std_distance / mean_distance)))

        result = ConsistencyResult(
            provider=data["provider"],
            model=data["model"],
            consistency_score=consistency,
            mean_distance=mean_distance,
            std_distance=std_distance,
            num_trials=len(valid_responses),
        )

        self.results.append(result)
        self.logger.info(
            f"Consistency: {data['provider']}/{data['model']} = {consistency:.3f}"
        )
        return result

    def validate(self, value: ConsistencyResult) -> bool:
        return (
            0.0 <= value.consistency_score <= 1.0
            and value.mean_distance >= 0
            and value.std_distance >= 0
            and value.num_trials > 0
        )
