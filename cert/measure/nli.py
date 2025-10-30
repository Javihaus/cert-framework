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
            import torch
            from transformers import AutoModelForSequenceClassification, AutoTokenizer
        except ImportError:
            raise ImportError(
                "transformers required for NLI. Install with: pip install transformers torch"
            )

        # Load model and tokenizer explicitly (not pipeline)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_name)
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)

        # Force model to eval mode (no training)
        self.model.eval()

        # Set device (GPU if available, else CPU)
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model.to(self.device)

        # Store torch module for later use
        self.torch = torch

        logger.info(f"NLI model loaded: {model_name} (device: {self.device})")

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

        # Log inputs for debugging
        logger.debug("\n=== NLI Call ===")
        logger.debug(f"Context: {context[:100]}...")
        logger.debug(f"Answer: {answer[:100]}...")

        # Force model back to eval mode (defensive)
        self.model.eval()

        # Tokenize inputs (premise and hypothesis)
        # Use text_pair for proper NLI formatting
        inputs = self.tokenizer(
            text=context,
            text_pair=answer,
            return_tensors="pt",
            padding="max_length",
            truncation=True,
            max_length=512,
        )

        # Move inputs to same device as model
        inputs = {key: val.to(self.device) for key, val in inputs.items()}

        logger.debug(f"Input IDs shape: {inputs['input_ids'].shape}")
        logger.debug(f"Input IDs sample: {inputs['input_ids'][0][:10]}")

        # Run inference (no gradient computation)
        with self.torch.no_grad():
            outputs = self.model(**inputs)

        # Get logits and convert to probabilities
        logits = outputs.logits
        probs = self.torch.softmax(logits, dim=-1)

        logger.debug(f"Logits: {logits}")
        logger.debug(f"Probs: {probs}")

        # Get predicted class (highest probability)
        predicted_class = self.torch.argmax(probs, dim=-1).item()

        # Map class index to label
        # DeBERTa NLI models typically use: 0=contradiction, 1=neutral, 2=entailment
        label_map = {0: "contradiction", 1: "neutral", 2: "entailment"}
        label = label_map.get(predicted_class, "neutral")
        score = probs[0][predicted_class].item()

        logger.debug(f"Predicted class: {predicted_class} -> {label} ({score:.3f})")

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
