"""
Response quality evaluation.

Provides:
- LLM-as-judge evaluation
- Behavioral consistency tracking
- Drift detection
"""

import json
import logging
import numpy as np
from typing import Dict, List, Optional

from cert.coordination.client import AnthropicClientWithResilience

logger = logging.getLogger(__name__)


class DriftDetector:
    """Detect quality drift over time."""

    def __init__(self, window_size: int = 100):
        """
        Initialize drift detector.

        Args:
            window_size: Number of samples to track
        """
        self._window_size = window_size
        self._samples: Dict[str, List[float]] = {}

    def add_sample(self, task: str, score: float):
        """
        Add quality score sample.

        Args:
            task: Task identifier
            score: Quality score (0-1)
        """
        if task not in self._samples:
            self._samples[task] = []

        self._samples[task].append(score)

        # Keep only recent samples
        if len(self._samples[task]) > self._window_size:
            self._samples[task] = self._samples[task][-self._window_size :]

    def detect_drift(self, task: str, threshold: float = 0.1) -> bool:
        """
        Detect if quality has drifted significantly.

        Uses moving average comparison between recent and historical means.

        Args:
            task: Task identifier
            threshold: Drift threshold (default: 0.1)

        Returns:
            True if drift detected
        """
        samples = self._samples.get(task, [])

        if len(samples) < 20:
            return False  # Not enough data

        # Compare recent mean to historical mean
        recent_mean = np.mean(samples[-10:])
        historical_mean = np.mean(samples[:-10])

        drift = abs(recent_mean - historical_mean)

        if drift > threshold:
            logger.warning(
                f"Quality drift detected for task: {task[:50]}...",
                extra={
                    "recent_mean": recent_mean,
                    "historical_mean": historical_mean,
                    "drift": drift,
                    "threshold": threshold,
                },
            )
            return True

        return False

    def get_stats(self, task: str) -> Optional[dict]:
        """Get statistics for a task."""
        samples = self._samples.get(task, [])
        if not samples:
            return None

        return {
            "count": len(samples),
            "mean": np.mean(samples),
            "std": np.std(samples),
            "min": min(samples),
            "max": max(samples),
        }


class QualityEvaluator:
    """Evaluate response quality using LLM-as-judge."""

    def __init__(
        self,
        client: AnthropicClientWithResilience,
        evaluation_criteria: Optional[Dict[str, str]] = None,
        evaluator_model: str = "claude-3-5-sonnet-20241022",
    ):
        """
        Initialize quality evaluator.

        Args:
            client: Anthropic API client
            evaluation_criteria: Custom evaluation criteria
            evaluator_model: Model to use for evaluation
        """
        self._client = client
        self._criteria = evaluation_criteria or self._default_criteria()
        self._evaluator_model = evaluator_model
        self._drift_detector = DriftDetector()

    def _default_criteria(self) -> Dict[str, str]:
        """Default evaluation criteria."""
        return {
            "accuracy": "Is the response factually accurate and correct?",
            "relevance": "Is the response relevant and on-topic for the task?",
            "completeness": "Does the response fully address all aspects of the task?",
            "clarity": "Is the response clear, well-organized, and understandable?",
        }

    async def evaluate_response(
        self,
        task: str,
        response: str,
    ) -> float:
        """
        Evaluate response quality (0-1 scale).

        Uses LLM-as-judge with structured evaluation criteria.

        Args:
            task: Original task/question
            response: Response to evaluate

        Returns:
            Quality score (0-1)
        """
        # Build evaluation prompt
        criteria_str = "\n".join(
            f"- {name}: {desc}" for name, desc in self._criteria.items()
        )

        prompt = f"""Evaluate the following response to a task:

Task: {task}

Response: {response}

Evaluation criteria:
{criteria_str}

Provide a score from 0-10 for each criterion, then compute the average.

Format your response as JSON:
{{
  "accuracy": <score>,
  "relevance": <score>,
  "completeness": <score>,
  "clarity": <score>,
  "average": <average score>
}}

Respond ONLY with valid JSON."""

        try:
            eval_response = await self._client.complete(
                prompt=prompt,
                agent_id="evaluator",
                model=self._evaluator_model,
                temperature=0.0,  # Deterministic evaluation
            )

            # Parse JSON response
            # Extract JSON from potential markdown code blocks
            if "```json" in eval_response:
                eval_response = eval_response.split("```json")[1].split("```")[0]
            elif "```" in eval_response:
                eval_response = eval_response.split("```")[1].split("```")[0]

            scores = json.loads(eval_response.strip())
            score = scores["average"] / 10.0  # Normalize to 0-1

            # Track for drift detection
            self._drift_detector.add_sample(task[:100], score)

            logger.debug(
                "Quality evaluation complete",
                extra={
                    "task_length": len(task),
                    "response_length": len(response),
                    "score": score,
                },
            )

            return score

        except (json.JSONDecodeError, KeyError, ValueError) as e:
            logger.warning(
                f"Failed to parse evaluation response: {e}",
                extra={"response": eval_response[:200]},
            )
            # Default to neutral score
            return 0.5

        except Exception as e:
            logger.error(f"Evaluation failed: {e}", exc_info=True)
            return 0.5

    def check_drift(self, task: str, threshold: float = 0.1) -> bool:
        """
        Check if quality drift detected for task.

        Args:
            task: Task identifier
            threshold: Drift threshold

        Returns:
            True if drift detected
        """
        return self._drift_detector.detect_drift(task, threshold)

    def get_task_stats(self, task: str) -> Optional[dict]:
        """Get statistics for a task."""
        return self._drift_detector.get_stats(task)
