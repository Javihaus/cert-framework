"""Natural Language Inference (NLI) for contradiction detection.

This module provides NLI-based hallucination detection for RAG systems.
Uses transformer-based models to detect when outputs contradict source context.
"""

import logging
from dataclasses import dataclass
from typing import Dict, Literal

logger = logging.getLogger(__name__)


@dataclass
class NLIResult:
    """Result of NLI inference.

    Attributes:
        label: Relationship between premise (context) and hypothesis (answer)
        score: Model confidence (0.0-1.0)
        entailment_score: Normalized score where 1.0 = fully entailed, 0.0 = contradiction
    """

    label: Literal["entailment", "neutral", "contradiction"]
    score: float
    entailment_score: float


class NLIEngine:
    """Natural Language Inference engine for hallucination detection.

    Uses transformer-based NLI to detect when answers contradict
    the provided context. Critical for RAG systems.

    Model: microsoft/deberta-v3-base
    - Trained on MNLI dataset (392k examples)
    - 90%+ accuracy on contradiction detection
    - ~500MB download first time

    Example:
        engine = NLIEngine()
        result = engine.check_entailment(
            context="Apple's revenue was $391B",
            answer="Apple's revenue was $450B"
        )
        # result.label = "contradiction"
        # result.entailment_score = 0.15 (low = contradiction)
    """

    def __init__(self, model_name: str = "microsoft/deberta-v3-base"):
        """Initialize NLI engine.

        Args:
            model_name: HuggingFace model name for NLI

        Note: First run downloads ~500MB model. Subsequent runs load
        from cache (~2 seconds).
        """
        self.model_name = model_name

        logger.info(f"Loading NLI model: {model_name}")

        try:
            from transformers import pipeline
        except ImportError:
            raise ImportError(
                "transformers required for NLI. Install with: pip install transformers torch"
            )

        self.nli = pipeline(
            "text-classification",
            model=model_name,
            device=-1,  # CPU (use device=0 for GPU)
            top_k=None,  # Return all label scores
        )

        logger.info(f"NLI model loaded: {model_name}")

    def check_entailment(self, context: str, answer: str) -> NLIResult:
        """Check if answer is entailed by context.

        Args:
            context: Source context (premise)
            answer: Answer to check (hypothesis)

        Returns:
            NLIResult with label and normalized scores

        Examples:
            Entailment (score → 1.0):
              context: "Revenue was $391B"
              answer: "Revenue was $391 billion"

            Contradiction (score → 0.0):
              context: "Revenue was $391B"
              answer: "Revenue was $450B"

            Neutral (score → 0.5):
              context: "Revenue was $391B"
              answer: "The company performed well"
        """
        # Validate inputs
        if not context or not answer:
            raise ValueError(f"Empty input: context={bool(context)}, answer={bool(answer)}")

        if len(context) > 10000 or len(answer) > 10000:
            raise ValueError(f"Text too long: context={len(context)}, answer={len(answer)}")

        # Format for NLI: premise [SEP] hypothesis
        # Model checks if hypothesis follows from premise
        result = self.nli(
            f"{context} [SEP] {answer}",
            truncation=True,
            max_length=512,
        )

        # Result is list of dicts with 'label' and 'score'
        # Find the label with highest score
        best = max(result[0], key=lambda x: x["score"])
        label = self._normalize_label(best["label"])
        score = best["score"]

        # Convert to normalized entailment score
        entailment_score = self._normalize_score(label, score)

        return NLIResult(
            label=label,
            score=score,
            entailment_score=entailment_score,
        )

    def _normalize_label(self, raw_label: str) -> Literal["entailment", "neutral", "contradiction"]:
        """Normalize model label to standard format."""
        label_lower = raw_label.lower()
        if "entail" in label_lower:
            return "entailment"
        elif "contra" in label_lower:
            return "contradiction"
        else:
            return "neutral"

    def _normalize_score(self, label: str, score: float) -> float:
        """Convert NLI output to [0, 1] where 1 = entailed, 0 = contradiction.

        This normalization allows combining NLI with other metrics:
        - entailment → score (0.8-1.0)
        - neutral → 0.5 (ambiguous)
        - contradiction → 1 - score (0.0-0.2)
        """
        if label == "entailment":
            return score
        elif label == "neutral":
            return 0.5
        else:  # contradiction
            return 1.0 - score


# Global model cache for efficient reuse across multiple calls
_NLI_MODEL_CACHE: Dict[str, NLIEngine] = {}


def get_nli_engine(model_name: str = "microsoft/deberta-v3-base") -> NLIEngine:
    """Get global NLI engine with model caching.

    Models are cached by name to avoid reloading. This significantly improves
    performance when measure() is called multiple times.

    Args:
        model_name: HuggingFace model name

    Returns:
        NLIEngine instance (reuses cached model if available)
    """
    if model_name not in _NLI_MODEL_CACHE:
        logger.info(f"Loading NLI model: {model_name}")
        _NLI_MODEL_CACHE[model_name] = NLIEngine(model_name=model_name)
    else:
        logger.debug(f"Reusing cached NLI engine: {model_name}")

    return _NLI_MODEL_CACHE[model_name]
