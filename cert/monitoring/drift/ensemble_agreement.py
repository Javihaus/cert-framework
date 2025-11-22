"""
Ensemble Agreement Monitoring for LLM Reliability

This module tracks agreement between multiple LLM models or multiple runs
of the same model to detect inconsistencies, hallucinations, and reliability issues.

Key Features:
- Multi-model consensus tracking
- Self-consistency checking (multiple samples)
- Factual grounding verification
- Confidence calibration
- Disagreement analysis
"""

import json
import statistics
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Callable


class AgreementLevel(Enum):
    """Agreement levels between ensemble members."""

    FULL = "full"  # All responses agree
    HIGH = "high"  # >80% agreement
    MODERATE = "moderate"  # 60-80% agreement
    LOW = "low"  # 40-60% agreement
    NONE = "none"  # <40% agreement


@dataclass
class EnsembleResponse:
    """Response from a single ensemble member."""

    model_id: str
    response: str
    confidence: float | None = None
    latency_ms: float = 0.0
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class AgreementResult:
    """Result of an ensemble agreement check."""

    query: str
    responses: list[EnsembleResponse]
    agreement_level: AgreementLevel
    agreement_score: float  # 0.0 = no agreement, 1.0 = full agreement
    consensus_response: str | None  # Most common response
    disagreement_details: list[dict[str, Any]]
    timestamp: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "query": self.query,
            "responses": [
                {
                    "model_id": r.model_id,
                    "response": r.response,
                    "confidence": r.confidence,
                    "latency_ms": r.latency_ms,
                }
                for r in self.responses
            ],
            "agreement_level": self.agreement_level.value,
            "agreement_score": self.agreement_score,
            "consensus_response": self.consensus_response,
            "disagreement_details": self.disagreement_details,
            "timestamp": self.timestamp.isoformat(),
        }


@dataclass
class EnsembleMember:
    """Definition of an ensemble member."""

    model_id: str
    call_function: Callable[[str], str]
    weight: float = 1.0  # Weight in consensus calculation
    is_primary: bool = False


class EnsembleAgreementMonitor:
    """
    Monitors agreement between multiple LLM models or runs.

    This class implements ensemble-based verification techniques to detect
    inconsistencies and improve reliability:
    - Multi-model ensembles: Query multiple models and check consensus
    - Self-consistency: Run the same model multiple times
    - Confidence calibration: Track when models agree vs disagree

    Example:
        # Multi-model ensemble
        monitor = EnsembleAgreementMonitor()
        monitor.add_model("gpt-4", gpt4_function)
        monitor.add_model("claude", claude_function)
        monitor.add_model("gemini", gemini_function)

        result = monitor.check_agreement("What is the capital of France?")
        print(f"Agreement: {result.agreement_level}")

        # Self-consistency mode
        monitor = EnsembleAgreementMonitor(mode="self-consistency", samples=5)
        monitor.add_model("gpt-4", gpt4_function)
        result = monitor.check_agreement("Explain quantum entanglement")
    """

    def __init__(
        self,
        mode: str = "ensemble",  # "ensemble" or "self-consistency"
        samples: int = 3,  # Number of samples for self-consistency
        agreement_threshold: float = 0.7,
        use_semantic_similarity: bool = True,
        on_disagreement_callback: Callable[[AgreementResult], None] | None = None,
    ):
        """
        Initialize the ensemble agreement monitor.

        Args:
            mode: "ensemble" for multi-model or "self-consistency" for same model
            samples: Number of samples per query (for self-consistency mode)
            agreement_threshold: Minimum agreement score to consider reliable
            use_semantic_similarity: Use embeddings for semantic comparison
            on_disagreement_callback: Callback when agreement is low
        """
        self.mode = mode
        self.samples = samples
        self.agreement_threshold = agreement_threshold
        self.use_semantic_similarity = use_semantic_similarity
        self.on_disagreement_callback = on_disagreement_callback

        self._models: dict[str, EnsembleMember] = {}
        self._history: list[AgreementResult] = []
        self._embedding_engine: Any = None

    def _get_embedding_engine(self) -> Any:
        """Lazy load the embedding engine."""
        if self._embedding_engine is None and self.use_semantic_similarity:
            try:
                from cert.measure.embeddings import get_embedding_engine

                self._embedding_engine = get_embedding_engine()
            except ImportError:
                pass
        return self._embedding_engine

    def add_model(
        self,
        model_id: str,
        call_function: Callable[[str], str],
        weight: float = 1.0,
        is_primary: bool = False,
    ) -> None:
        """
        Add a model to the ensemble.

        Args:
            model_id: Unique identifier for the model
            call_function: Function that takes prompt and returns response
            weight: Weight in consensus calculation
            is_primary: Mark as primary model (for comparison)
        """
        self._models[model_id] = EnsembleMember(
            model_id=model_id,
            call_function=call_function,
            weight=weight,
            is_primary=is_primary,
        )

    def remove_model(self, model_id: str) -> bool:
        """Remove a model from the ensemble."""
        if model_id in self._models:
            del self._models[model_id]
            return True
        return False

    def _call_model(self, member: EnsembleMember, query: str) -> EnsembleResponse:
        """Call a single model and capture response."""
        start_time = datetime.utcnow()
        try:
            response = member.call_function(query)
            latency_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
            return EnsembleResponse(
                model_id=member.model_id,
                response=response,
                latency_ms=latency_ms,
            )
        except Exception as e:
            return EnsembleResponse(
                model_id=member.model_id,
                response="",
                latency_ms=0.0,
                metadata={"error": str(e)},
            )

    def _compute_pairwise_similarity(
        self,
        response1: str,
        response2: str,
    ) -> float:
        """Compute similarity between two responses."""
        engine = self._get_embedding_engine()

        if engine:
            try:
                emb1 = engine.encode(response1, convert_to_numpy=True)
                emb2 = engine.encode(response2, convert_to_numpy=True)

                # Cosine similarity
                dot_product = sum(a * b for a, b in zip(emb1, emb2))
                norm1 = sum(a * a for a in emb1) ** 0.5
                norm2 = sum(b * b for b in emb2) ** 0.5

                if norm1 > 0 and norm2 > 0:
                    return dot_product / (norm1 * norm2)
            except Exception:
                pass

        # Fall back to word overlap similarity
        words1 = set(response1.lower().split())
        words2 = set(response2.lower().split())

        if not words1 or not words2:
            return 0.0

        intersection = words1 & words2
        union = words1 | words2
        return len(intersection) / len(union)

    def _compute_agreement_matrix(
        self,
        responses: list[EnsembleResponse],
    ) -> list[list[float]]:
        """Compute pairwise agreement matrix."""
        n = len(responses)
        matrix = [[1.0] * n for _ in range(n)]

        for i in range(n):
            for j in range(i + 1, n):
                similarity = self._compute_pairwise_similarity(
                    responses[i].response,
                    responses[j].response,
                )
                matrix[i][j] = similarity
                matrix[j][i] = similarity

        return matrix

    def _compute_overall_agreement(
        self,
        matrix: list[list[float]],
        weights: list[float] | None = None,
    ) -> float:
        """Compute overall agreement score from matrix."""
        n = len(matrix)
        if n < 2:
            return 1.0

        if weights is None:
            weights = [1.0] * n

        total_similarity = 0.0
        total_weight = 0.0

        for i in range(n):
            for j in range(i + 1, n):
                pair_weight = weights[i] * weights[j]
                total_similarity += matrix[i][j] * pair_weight
                total_weight += pair_weight

        return total_similarity / total_weight if total_weight > 0 else 0.0

    def _determine_agreement_level(self, score: float) -> AgreementLevel:
        """Determine agreement level from score."""
        if score >= 0.95:
            return AgreementLevel.FULL
        elif score >= 0.8:
            return AgreementLevel.HIGH
        elif score >= 0.6:
            return AgreementLevel.MODERATE
        elif score >= 0.4:
            return AgreementLevel.LOW
        return AgreementLevel.NONE

    def _find_consensus_response(
        self,
        responses: list[EnsembleResponse],
        matrix: list[list[float]],
    ) -> str | None:
        """Find the most representative response (highest average similarity)."""
        if not responses:
            return None

        n = len(responses)
        avg_similarities = []

        for i in range(n):
            avg_sim = sum(matrix[i]) / n
            avg_similarities.append((avg_sim, responses[i].response))

        # Return response with highest average similarity
        avg_similarities.sort(reverse=True)
        return avg_similarities[0][1]

    def _identify_disagreements(
        self,
        responses: list[EnsembleResponse],
        matrix: list[list[float]],
    ) -> list[dict[str, Any]]:
        """Identify specific disagreements between responses."""
        disagreements = []
        n = len(responses)

        for i in range(n):
            for j in range(i + 1, n):
                if matrix[i][j] < 0.5:  # Significant disagreement
                    disagreements.append(
                        {
                            "model_1": responses[i].model_id,
                            "model_2": responses[j].model_id,
                            "similarity": matrix[i][j],
                            "response_1_preview": responses[i].response[:200],
                            "response_2_preview": responses[j].response[:200],
                        }
                    )

        return disagreements

    def check_agreement(self, query: str) -> AgreementResult:
        """
        Check agreement between ensemble members for a query.

        Args:
            query: The prompt to send to all models

        Returns:
            AgreementResult with detailed agreement analysis
        """
        responses = []

        if self.mode == "self-consistency":
            # Run the first model multiple times
            if not self._models:
                return AgreementResult(
                    query=query,
                    responses=[],
                    agreement_level=AgreementLevel.NONE,
                    agreement_score=0.0,
                    consensus_response=None,
                    disagreement_details=[{"error": "No models configured"}],
                )

            model = list(self._models.values())[0]
            for i in range(self.samples):
                response = self._call_model(model, query)
                response.model_id = f"{model.model_id}_sample_{i}"
                responses.append(response)
        else:
            # Ensemble mode - call all models
            for model in self._models.values():
                response = self._call_model(model, query)
                responses.append(response)

        # Filter out failed responses
        valid_responses = [r for r in responses if r.response]

        if len(valid_responses) < 2:
            return AgreementResult(
                query=query,
                responses=responses,
                agreement_level=AgreementLevel.NONE,
                agreement_score=0.0,
                consensus_response=valid_responses[0].response if valid_responses else None,
                disagreement_details=[{"error": "Insufficient valid responses"}],
            )

        # Compute agreement
        weights = [
            self._models.get(
                r.model_id.split("_sample_")[0], EnsembleMember("", lambda x: "", 1.0)
            ).weight
            for r in valid_responses
        ]

        matrix = self._compute_agreement_matrix(valid_responses)
        agreement_score = self._compute_overall_agreement(matrix, weights)
        agreement_level = self._determine_agreement_level(agreement_score)
        consensus = self._find_consensus_response(valid_responses, matrix)
        disagreements = self._identify_disagreements(valid_responses, matrix)

        result = AgreementResult(
            query=query,
            responses=responses,
            agreement_level=agreement_level,
            agreement_score=agreement_score,
            consensus_response=consensus,
            disagreement_details=disagreements,
        )

        # Store in history
        self._history.append(result)

        # Call callback if low agreement
        if agreement_score < self.agreement_threshold and self.on_disagreement_callback:
            self.on_disagreement_callback(result)

        return result

    def get_statistics(
        self,
        limit: int | None = None,
    ) -> dict[str, Any]:
        """
        Get ensemble monitoring statistics.

        Args:
            limit: Maximum history items to consider

        Returns:
            Dictionary of statistics
        """
        history = self._history[-limit:] if limit else self._history

        if not history:
            return {
                "total_checks": 0,
                "agreement_levels": {},
                "average_agreement": 0.0,
            }

        # Agreement level distribution
        level_counts: dict[str, int] = {}
        for result in history:
            level = result.agreement_level.value
            level_counts[level] = level_counts.get(level, 0) + 1

        # Agreement score statistics
        scores = [r.agreement_score for r in history]

        return {
            "total_checks": len(history),
            "agreement_levels": level_counts,
            "average_agreement": statistics.mean(scores),
            "min_agreement": min(scores),
            "max_agreement": max(scores),
            "std_agreement": statistics.stdev(scores) if len(scores) > 1 else 0,
            "low_agreement_rate": sum(
                1 for r in history if r.agreement_score < self.agreement_threshold
            )
            / len(history),
        }

    def export_history(self, filepath: str) -> bool:
        """Export history to JSON file."""
        try:
            data = [r.to_dict() for r in self._history]
            with open(filepath, "w") as f:
                json.dump(data, f, indent=2)
            return True
        except Exception:
            return False

    def get_model_reliability(self) -> dict[str, dict[str, float]]:
        """
        Compute reliability scores for each model based on agreement patterns.

        Returns:
            Dictionary mapping model_id to reliability metrics
        """
        model_scores: dict[str, list[float]] = {model_id: [] for model_id in self._models}

        for result in self._history:
            for response in result.responses:
                base_model = response.model_id.split("_sample_")[0]
                if base_model in model_scores:
                    model_scores[base_model].append(result.agreement_score)

        reliability = {}
        for model_id, scores in model_scores.items():
            if scores:
                reliability[model_id] = {
                    "average_agreement": statistics.mean(scores),
                    "checks_participated": len(scores),
                    "high_agreement_rate": sum(1 for s in scores if s >= 0.8) / len(scores),
                }
            else:
                reliability[model_id] = {
                    "average_agreement": 0.0,
                    "checks_participated": 0,
                    "high_agreement_rate": 0.0,
                }

        return reliability
