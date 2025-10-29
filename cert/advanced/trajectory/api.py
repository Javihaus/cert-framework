"""
Production API for Hamiltonian trajectory monitoring.

Provides:
- Synchronous API (backward compatible)
- Asynchronous API (for high throughput)
- Configuration management
- Health checks
- Batch processing
"""

import asyncio
import logging
import uuid
from typing import List, Optional, Union

from cert.advanced.trajectory.engine import HamiltonianEngine
from cert.advanced.trajectory.resources import HamiltonianModelResource
from cert.advanced.trajectory.types import TrajectoryAnalysis, TrajectoryConfig
from cert.core.errors import AnalysisError
from cert.core.health import HealthChecker, HealthCheckResult
from cert.observability.logging import correlation_id_context
from cert.observability.metrics import MetricsCollector

logger = logging.getLogger(__name__)


class HamiltonianMonitor:
    """Production Hamiltonian trajectory monitor."""

    def __init__(
        self,
        model_name: str = "Qwen/Qwen2.5-7B-Instruct",
        config: Optional[TrajectoryConfig] = None,
        preload: bool = True,
        use_8bit: bool = True,
        device: str = "auto",
        cache_size: int = 1000,
        enable_metrics: bool = True,
    ):
        """
        Initialize Hamiltonian monitor.

        Args:
            model_name: HuggingFace model identifier
            config: Trajectory configuration (uses defaults if None)
            preload: Preload model on initialization (30s startup, fast requests)
            use_8bit: Use 8-bit quantization for memory efficiency
            device: Device selection ('auto', 'cuda', 'cpu')
            cache_size: Maximum cache size for analysis results
            enable_metrics: Enable Prometheus metrics collection
        """
        self._model_name = model_name
        self._config = config or TrajectoryConfig()
        self._metrics = MetricsCollector(enabled=enable_metrics)

        # Initialize model resource
        logger.info(
            "Initializing HamiltonianMonitor",
            extra={
                "model": model_name,
                "preload": preload,
                "use_8bit": use_8bit,
                "device": device,
            },
        )

        self._model_resource = HamiltonianModelResource(
            model_name=model_name,
            device=device,
            use_8bit=use_8bit,
            preload=preload,
        )

        # Initialize engine
        self._engine = HamiltonianEngine(
            model_resource=self._model_resource,
            config=self._config,
            metrics=self._metrics,
            cache_size=cache_size,
        )

        # Health checker
        self._health_checker = HealthChecker()
        self._health_checker.register("model", self._check_model_health)
        self._health_checker.register("inference", self._check_inference_health)

        logger.info("HamiltonianMonitor initialized successfully")

    def analyze(
        self,
        prompt: str,
        timeout: float = 30.0,
        max_new_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> Union[TrajectoryAnalysis, AnalysisError]:
        """
        Analyze text generation trajectory (synchronous).

        Args:
            prompt: Input prompt for generation
            timeout: Maximum analysis time (seconds)
            max_new_tokens: Override config default
            temperature: Override config default

        Returns:
            TrajectoryAnalysis on success, AnalysisError on failure

        Example:
            monitor = HamiltonianMonitor()
            result = monitor.analyze("Explain quantum computing")

            if isinstance(result, AnalysisError):
                print(f"Error: {result.message}")
            else:
                print(f"Quality: {'PASSED' if result.passed_quality_check else 'FAILED'}")
        """
        correlation_id = str(uuid.uuid4())

        with correlation_id_context(correlation_id):
            logger.info(
                "Starting trajectory analysis",
                extra={
                    "correlation_id": correlation_id,
                    "prompt_length": len(prompt),
                    "max_new_tokens": max_new_tokens or self._config.max_new_tokens,
                },
            )

            result = self._engine.analyze(
                prompt=prompt,
                timeout=timeout,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
            )

            if isinstance(result, AnalysisError):
                logger.error(
                    "Trajectory analysis failed",
                    extra={
                        "correlation_id": correlation_id,
                        "error_type": result.error_type,
                        "message": result.message,
                        "recoverable": result.recoverable,
                    },
                )
            else:
                logger.info(
                    "Trajectory analysis completed",
                    extra={
                        "correlation_id": correlation_id,
                        "quality": "passed" if result.passed_quality_check else "failed",
                        "tokens_generated": result.generation_steps,
                    },
                )

            return result

    async def analyze_async(
        self,
        prompt: str,
        timeout: float = 30.0,
        max_new_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> Union[TrajectoryAnalysis, AnalysisError]:
        """
        Analyze text generation trajectory (asynchronous).

        Useful for high-throughput scenarios where blocking is unacceptable.

        Args:
            prompt: Input prompt for generation
            timeout: Maximum analysis time (seconds)
            max_new_tokens: Override config default
            temperature: Override config default

        Returns:
            TrajectoryAnalysis on success, AnalysisError on failure

        Example:
            monitor = HamiltonianMonitor()
            result = await monitor.analyze_async("Explain quantum computing")
        """
        # Run in thread pool (model inference blocks)
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            self.analyze,
            prompt,
            timeout,
            max_new_tokens,
            temperature,
        )

    def analyze_batch(
        self,
        prompts: List[str],
        timeout: float = 60.0,
        max_new_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> List[Union[TrajectoryAnalysis, AnalysisError]]:
        """
        Analyze multiple prompts in batch.

        More efficient than individual calls due to shared model loading overhead.

        Args:
            prompts: List of input prompts
            timeout: Total timeout for all prompts (seconds)
            max_new_tokens: Override config default
            temperature: Override config default

        Returns:
            List of TrajectoryAnalysis or AnalysisError results

        Example:
            monitor = HamiltonianMonitor()
            prompts = ["Explain AI", "What is ML?", "Define NLP"]
            results = monitor.analyze_batch(prompts)
        """
        logger.info("Starting batch analysis", extra={"num_prompts": len(prompts)})

        results = []
        per_prompt_timeout = timeout / len(prompts) if prompts else timeout

        for i, prompt in enumerate(prompts):
            logger.debug(f"Analyzing prompt {i + 1}/{len(prompts)}")

            result = self.analyze(
                prompt=prompt,
                timeout=per_prompt_timeout,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
            )
            results.append(result)

        logger.info(
            "Batch analysis complete",
            extra={
                "num_prompts": len(prompts),
                "num_success": sum(1 for r in results if isinstance(r, TrajectoryAnalysis)),
                "num_errors": sum(1 for r in results if isinstance(r, AnalysisError)),
            },
        )

        return results

    async def analyze_batch_async(
        self,
        prompts: List[str],
        timeout: float = 60.0,
        max_new_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> List[Union[TrajectoryAnalysis, AnalysisError]]:
        """
        Analyze multiple prompts in batch (asynchronous).

        Args:
            prompts: List of input prompts
            timeout: Total timeout for all prompts (seconds)
            max_new_tokens: Override config default
            temperature: Override config default

        Returns:
            List of TrajectoryAnalysis or AnalysisError results
        """
        per_prompt_timeout = timeout / len(prompts) if prompts else timeout

        tasks = [
            self.analyze_async(
                prompt=prompt,
                timeout=per_prompt_timeout,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
            )
            for prompt in prompts
        ]

        return await asyncio.gather(*tasks)

    def health_check(self) -> HealthCheckResult:
        """
        Check service health.

        Returns:
            HealthCheckResult with status and component checks

        Example:
            monitor = HamiltonianMonitor()
            health = monitor.health_check()
            if health.status == HealthStatus.HEALTHY:
                print("Service is healthy")
        """
        return self._health_checker.check_health()

    def _check_model_health(self) -> bool:
        """Check if model is loaded."""
        return self._model_resource.health_check()

    def _check_inference_health(self) -> bool:
        """Check if model can perform inference."""
        return self._model_resource.test_inference()

    def clear_cache(self):
        """Clear analysis cache."""
        self._engine.clear_cache()
        logger.info("Cache cleared")

    def unload(self):
        """Unload model and free resources."""
        self._model_resource.unload()
        logger.info("Model unloaded")

    def __enter__(self):
        """Context manager entry."""
        return self

    def __exit__(self, *args):
        """Context manager exit with cleanup."""
        self.unload()

    @property
    def config(self) -> TrajectoryConfig:
        """Get current configuration."""
        return self._config

    @property
    def metrics(self) -> MetricsCollector:
        """Get metrics collector."""
        return self._metrics
