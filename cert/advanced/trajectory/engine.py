"""
Production-grade Hamiltonian analysis engine.

Extracted from notebooks with:
- Input validation
- Batch processing with memory bounds
- Timeout handling
- Comprehensive error handling
- LRU caching
- CPU fallback for GPU OOM
"""

import logging
import time
from typing import Optional, Union
import hashlib
import json

import torch
import numpy as np

from cert.advanced.trajectory.types import TrajectoryAnalysis, TrajectoryConfig, ReasoningMetrics
from cert.advanced.trajectory.resources import HamiltonianModelResource
from cert.core.errors import (
    AnalysisError,
    GPUOutOfMemoryError,
)
from cert.observability.metrics import MetricsCollector

logger = logging.getLogger(__name__)


class EmbeddingCache:
    """LRU cache for trajectory analysis results."""

    def __init__(self, maxsize: int = 1000):
        """
        Initialize cache.

        Args:
            maxsize: Maximum cache size
        """
        self._maxsize = maxsize
        self._cache = {}
        self._access_order = []

    def _compute_key(self, prompt: str, config: TrajectoryConfig) -> str:
        """Compute cache key from prompt and config."""
        config_str = json.dumps(config.to_dict(), sort_keys=True)
        key_data = f"{prompt}:{config_str}"
        return hashlib.md5(key_data.encode()).hexdigest()

    def get(
        self, prompt: str, config: TrajectoryConfig
    ) -> Optional[TrajectoryAnalysis]:
        """Get cached result."""
        key = self._compute_key(prompt, config)
        if key in self._cache:
            # Update access order (LRU)
            self._access_order.remove(key)
            self._access_order.append(key)
            return self._cache[key]
        return None

    def set(self, prompt: str, config: TrajectoryConfig, result: TrajectoryAnalysis):
        """Cache result."""
        key = self._compute_key(prompt, config)

        # Evict oldest if at capacity
        if len(self._cache) >= self._maxsize and key not in self._cache:
            oldest_key = self._access_order.pop(0)
            del self._cache[oldest_key]

        # Add to cache
        self._cache[key] = result
        if key in self._access_order:
            self._access_order.remove(key)
        self._access_order.append(key)

    def clear(self):
        """Clear cache."""
        self._cache.clear()
        self._access_order.clear()

    @property
    def size(self) -> int:
        """Current cache size."""
        return len(self._cache)


class HamiltonianEngine:
    """Production-grade Hamiltonian trajectory analysis engine."""

    def __init__(
        self,
        model_resource: HamiltonianModelResource,
        config: Optional[TrajectoryConfig] = None,
        metrics: Optional[MetricsCollector] = None,
        cache_size: int = 1000,
        max_prompt_length: int = 10000,
    ):
        """
        Initialize engine.

        Args:
            model_resource: Hamiltonian model resource
            config: Trajectory configuration
            metrics: Metrics collector
            cache_size: Maximum cache size
            max_prompt_length: Maximum prompt length (prevent DoS)
        """
        self._model_resource = model_resource
        self._config = config or TrajectoryConfig()
        self._metrics = metrics or MetricsCollector()
        self._cache = EmbeddingCache(maxsize=cache_size)
        self._max_prompt_length = max_prompt_length

    def analyze(
        self,
        prompt: str,
        timeout: float = 30.0,
        max_new_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> Union[TrajectoryAnalysis, AnalysisError]:
        """
        Analyze text generation with comprehensive error handling.

        Args:
            prompt: Input prompt for generation
            timeout: Maximum analysis time (seconds)
            max_new_tokens: Override config default
            temperature: Override config default

        Returns:
            TrajectoryAnalysis on success, AnalysisError on failure
        """
        start_time = time.time()

        # Input validation
        validation_error = self._validate_input(prompt)
        if validation_error:
            return validation_error

        # Use config defaults if not specified
        max_new_tokens = max_new_tokens or self._config.max_new_tokens
        temperature = temperature or self._config.temperature

        # Create effective config for caching
        effective_config = TrajectoryConfig(
            perplexity_threshold=self._config.perplexity_threshold,
            entropy_threshold=self._config.entropy_threshold,
            surprise_threshold=self._config.surprise_threshold,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            top_k=self._config.top_k,
            surprise_probability_threshold=self._config.surprise_probability_threshold,
        )

        # Check cache
        if cached := self._cache.get(prompt, effective_config):
            self._metrics.record_cache_hit("trajectory")
            logger.debug("Cache hit for trajectory analysis")
            return cached

        self._metrics.record_cache_miss("trajectory")

        # Analyze with timeout and error handling
        try:
            result = self._analyze_with_timeout(
                prompt=prompt,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                timeout=timeout,
            )

            if isinstance(result, TrajectoryAnalysis):
                # Cache successful result
                self._cache.set(prompt, effective_config, result)
                self._metrics.set_cache_size("trajectory", self._cache.size)

                # Record metrics
                duration = time.time() - start_time
                self._metrics.record_request(
                    service="hamiltonian",
                    status="success",
                    duration=duration,
                    operation="analyze",
                )

                # Record quality metrics
                self._metrics.hamiltonian_perplexity.observe(result.avg_perplexity)
                self._metrics.hamiltonian_entropy.observe(result.avg_entropy)
                self._metrics.hamiltonian_quality_checks.labels(
                    result="passed" if result.passed_quality_check else "failed"
                ).inc()

                logger.info(
                    "Trajectory analysis complete",
                    extra={
                        "prompt_length": len(prompt),
                        "generated_tokens": result.generation_steps,
                        "quality": "passed"
                        if result.passed_quality_check
                        else "failed",
                        "avg_perplexity": result.avg_perplexity,
                        "avg_entropy": result.avg_entropy,
                        "duration_s": duration,
                    },
                )

            return result

        except GPUOutOfMemoryError:
            logger.warning("GPU OOM in trajectory analysis, falling back to CPU")
            self._metrics.record_error("hamiltonian", "gpu_oom")

            # Try CPU fallback
            return self._analyze_with_cpu(prompt, max_new_tokens, temperature, timeout)

        except Exception as e:
            logger.exception("Unexpected error in trajectory analysis")
            self._metrics.record_error("hamiltonian", type(e).__name__)

            return AnalysisError(
                error_type="UnexpectedError",
                message=f"Trajectory analysis failed: {str(e)}",
                recoverable=False,
                context={"prompt_length": len(prompt)},
            )

    def _validate_input(self, prompt: str) -> Optional[AnalysisError]:
        """
        Validate input prompt.

        Args:
            prompt: Input prompt

        Returns:
            AnalysisError if invalid, None if valid
        """
        if not prompt or not isinstance(prompt, str):
            return AnalysisError(
                error_type="InvalidInput",
                message="Prompt must be a non-empty string",
                recoverable=False,
            )

        if len(prompt) > self._max_prompt_length:
            return AnalysisError(
                error_type="PromptTooLong",
                message=f"Prompt exceeds maximum length ({self._max_prompt_length})",
                recoverable=False,
                context={
                    "prompt_length": len(prompt),
                    "max_length": self._max_prompt_length,
                },
            )

        return None

    def _analyze_with_timeout(
        self,
        prompt: str,
        max_new_tokens: int,
        temperature: float,
        timeout: float,
    ) -> Union[TrajectoryAnalysis, AnalysisError]:
        """
        Perform analysis with timeout.

        Args:
            prompt: Input prompt
            max_new_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            timeout: Timeout in seconds

        Returns:
            TrajectoryAnalysis or AnalysisError
        """
        # Check if model is loaded
        if not self._model_resource.health_check():
            return AnalysisError(
                error_type="ModelNotLoaded",
                message="Model not loaded",
                recoverable=True,
                retry_after=5.0,
            )

        start = time.time()

        try:
            # Get model and tokenizer
            model, tokenizer = self._model_resource.get_model_and_tokenizer()
            device = self._model_resource.device

            # Tokenize input
            inputs = tokenizer(prompt, return_tensors="pt").to(device)
            input_length = inputs.input_ids.shape[1]

            # Generate with score tracking
            with torch.no_grad():
                outputs = model.generate(
                    inputs.input_ids,
                    max_new_tokens=max_new_tokens,
                    temperature=temperature,
                    do_sample=True,
                    return_dict_in_generate=True,
                    output_scores=True,
                    pad_token_id=tokenizer.eos_token_id,
                )

            # Check timeout
            if time.time() - start > timeout:
                return AnalysisError(
                    error_type="GenerationTimeout",
                    message=f"Generation exceeded timeout ({timeout}s)",
                    recoverable=True,
                    retry_after=2.0,
                )

            # Extract generated text
            generated_ids = outputs.sequences[0][input_length:]
            generated_text = tokenizer.decode(generated_ids, skip_special_tokens=True)

            # Calculate per-step metrics
            metrics_history = []
            cumulative_surprise = 0.0

            for step_idx, (token_id, scores) in enumerate(
                zip(generated_ids, outputs.scores)
            ):
                # Probability distribution
                probs = torch.softmax(scores[0], dim=-1)

                # Token-level metrics
                token_prob = probs[token_id].item()
                perplexity = 1.0 / token_prob if token_prob > 0 else float("inf")

                # Top-k entropy
                top_k_probs, _ = torch.topk(probs, k=self._config.top_k)
                top_k_entropy = -torch.sum(
                    top_k_probs * torch.log(top_k_probs + 1e-10)
                ).item()

                # Logit gap
                if len(top_k_probs) >= 2:
                    logit_gap = (top_k_probs[0] - top_k_probs[1]).item()
                else:
                    logit_gap = 0.0

                # Cumulative surprise
                if token_prob < self._config.surprise_probability_threshold:
                    cumulative_surprise += -np.log(token_prob + 1e-10)

                # Store metrics
                token_str = tokenizer.decode([token_id])
                metrics_history.append(
                    ReasoningMetrics(
                        step=step_idx,
                        token=token_str,
                        perplexity=perplexity,
                        top_k_entropy=top_k_entropy,
                        logit_gap=logit_gap,
                        cumulative_surprise=cumulative_surprise,
                    )
                )

            # Quality assessment
            valid_perplexities = [
                m.perplexity for m in metrics_history if m.perplexity != float("inf")
            ]

            avg_perplexity = (
                np.mean(valid_perplexities) if valid_perplexities else float("inf")
            )
            max_perplexity = (
                max(valid_perplexities) if valid_perplexities else float("inf")
            )
            avg_entropy = np.mean([m.top_k_entropy for m in metrics_history])
            max_entropy = max([m.top_k_entropy for m in metrics_history])

            # Pass/fail decision
            passed = (
                avg_perplexity < self._config.perplexity_threshold
                and max_entropy < self._config.entropy_threshold
                and cumulative_surprise < self._config.surprise_threshold
            )

            # Create analysis result
            return TrajectoryAnalysis(
                model_name=model.config._name_or_path,
                prompt=prompt,
                generated_text=generated_text,
                metrics=metrics_history,
                passed_quality_check=passed,
                avg_perplexity=avg_perplexity,
                max_perplexity=max_perplexity,
                avg_entropy=avg_entropy,
                max_entropy=max_entropy,
                final_surprise=cumulative_surprise,
                generation_steps=len(metrics_history),
                perplexity_threshold=self._config.perplexity_threshold,
                entropy_threshold=self._config.entropy_threshold,
                surprise_threshold=self._config.surprise_threshold,
            )

        except torch.cuda.OutOfMemoryError as e:
            raise GPUOutOfMemoryError("GPU memory exhausted during generation") from e

    def _analyze_with_cpu(
        self,
        prompt: str,
        max_new_tokens: int,
        temperature: float,
        timeout: float,
    ) -> Union[TrajectoryAnalysis, AnalysisError]:
        """
        Fallback to CPU analysis.

        Args:
            prompt: Input prompt
            max_new_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            timeout: Timeout in seconds

        Returns:
            TrajectoryAnalysis or AnalysisError
        """
        logger.info("Attempting CPU fallback for trajectory analysis")

        # Create CPU model resource
        cpu_resource = HamiltonianModelResource(
            model_name=self._model_resource._model_name,
            device="cpu",
            use_8bit=False,
        )

        try:
            cpu_resource.load()

            # Create temporary engine with CPU resource
            cpu_engine = HamiltonianEngine(
                model_resource=cpu_resource,
                config=self._config,
                metrics=self._metrics,
                cache_size=0,  # No caching for CPU fallback
            )

            # Analyze on CPU
            result = cpu_engine._analyze_with_timeout(
                prompt=prompt,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                timeout=timeout,
            )

            return result

        except Exception as e:
            logger.error(f"CPU fallback failed: {e}")
            return AnalysisError(
                error_type="CPUFallbackFailed",
                message=f"CPU fallback failed: {str(e)}",
                recoverable=False,
            )
        finally:
            cpu_resource.unload()

    def clear_cache(self):
        """Clear analysis cache."""
        self._cache.clear()
        logger.info("Trajectory analysis cache cleared")
