"""
Baseline measurement with caching.

Measures independent agent quality for comparison with coordinated performance.
"""

import hashlib
import json
import logging
import os
from datetime import datetime
from typing import Optional

from cert.advanced.coordination.types import AgentResponse, BaselineMeasurement
from cert.advanced.coordination.client import AnthropicClientWithResilience
from cert.advanced.coordination.evaluator import QualityEvaluator

logger = logging.getLogger(__name__)


class BaselineCache:
    """Cache baseline measurements to avoid redundant API calls."""

    def __init__(self, cache_file: str = ".cert_baseline_cache.json"):
        """
        Initialize baseline cache.

        Args:
            cache_file: Path to cache file
        """
        self._cache_file = cache_file
        self._cache = {}
        self._load_cache()

    def _load_cache(self):
        """Load cache from disk."""
        if os.path.exists(self._cache_file):
            try:
                with open(self._cache_file) as f:
                    data = json.load(f)
                    logger.info(f"Loaded {len(data)} baseline measurements from cache")
                    self._cache = data
            except Exception as e:
                logger.warning(f"Failed to load baseline cache: {e}")
                self._cache = {}

    def _save_cache(self):
        """Save cache to disk."""
        try:
            with open(self._cache_file, "w") as f:
                json.dump(self._cache, f, indent=2, default=str)
            logger.debug(f"Saved {len(self._cache)} baseline measurements to cache")
        except Exception as e:
            logger.error(f"Failed to save baseline cache: {e}")

    def _compute_key(self, task: str, num_agents: int) -> str:
        """Compute cache key."""
        key_data = f"{task}:{num_agents}"
        return hashlib.md5(key_data.encode()).hexdigest()

    def get(self, task: str, num_agents: int) -> Optional[dict]:
        """
        Get cached baseline measurement.

        Args:
            task: Task description
            num_agents: Number of agents

        Returns:
            Cached measurement dict or None
        """
        key = self._compute_key(task, num_agents)
        return self._cache.get(key)

    def set(self, task: str, num_agents: int, measurement: dict):
        """
        Cache baseline measurement.

        Args:
            task: Task description
            num_agents: Number of agents
            measurement: Measurement to cache
        """
        key = self._compute_key(task, num_agents)
        self._cache[key] = measurement
        self._save_cache()

    def clear(self):
        """Clear all cached measurements."""
        self._cache = {}
        self._save_cache()
        logger.info("Baseline cache cleared")

    @property
    def size(self) -> int:
        """Get cache size."""
        return len(self._cache)


class BaselineMeasurer:
    """Measure baseline quality of independent agents."""

    def __init__(
        self,
        client: AnthropicClientWithResilience,
        evaluator: QualityEvaluator,
        cache: Optional[BaselineCache] = None,
    ):
        """
        Initialize baseline measurer.

        Args:
            client: Anthropic API client
            evaluator: Quality evaluator
            cache: Optional baseline cache
        """
        self._client = client
        self._evaluator = evaluator
        self._cache = cache or BaselineCache()

    async def measure_baseline(
        self,
        task: str,
        num_agents: int,
        force_refresh: bool = False,
        model: str = "claude-3-5-sonnet-20241022",
    ) -> BaselineMeasurement:
        """
        Measure baseline quality of independent agents.

        Args:
            task: Task description
            num_agents: Number of agents
            force_refresh: Bypass cache
            model: Model to use

        Returns:
            BaselineMeasurement with quality scores
        """
        # Check cache
        if not force_refresh:
            if cached := self._cache.get(task, num_agents):
                logger.info(f"Using cached baseline for task: {task[:50]}...")

                # Reconstruct BaselineMeasurement from cached dict
                agent_responses = [
                    AgentResponse(
                        agent_id=r["agent_id"],
                        response=r["response"],
                        metadata=r.get("metadata", {}),
                        timestamp=datetime.fromisoformat(r["timestamp"]),
                    )
                    for r in cached["agent_responses"]
                ]

                return BaselineMeasurement(
                    agent_responses=agent_responses,
                    quality_scores=cached["quality_scores"],
                    mean_quality=cached["mean_quality"],
                    timestamp=datetime.fromisoformat(cached["timestamp"]),
                )

        logger.info(
            f"Measuring baseline for {num_agents} agents",
            extra={"task_length": len(task), "num_agents": num_agents},
        )

        # Query each agent independently
        responses = []
        for i in range(num_agents):
            response_text = await self._client.complete(
                prompt=task,
                agent_id=f"baseline_agent_{i}",
                model=model,
            )

            response = AgentResponse(
                agent_id=f"baseline_agent_{i}",
                response=response_text,
                metadata={"model": model},
                timestamp=datetime.now(),
            )
            responses.append(response)

        # Evaluate quality of each response
        quality_scores = []
        for response in responses:
            score = await self._evaluator.evaluate_response(
                task=task,
                response=response.response,
            )
            quality_scores.append(score)

        # Compute mean baseline quality
        mean_quality = sum(quality_scores) / len(quality_scores)

        measurement = BaselineMeasurement(
            agent_responses=responses,
            quality_scores=quality_scores,
            mean_quality=mean_quality,
            timestamp=datetime.now(),
        )

        # Cache result
        self._cache.set(task, num_agents, measurement.to_dict())

        logger.info(
            "Baseline measurement complete",
            extra={
                "task_length": len(task),
                "num_agents": num_agents,
                "mean_quality": mean_quality,
                "quality_range": (min(quality_scores), max(quality_scores)),
            },
        )

        return measurement
