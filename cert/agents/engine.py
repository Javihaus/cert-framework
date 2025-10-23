"""CERT Agent Assessment Engine - main orchestration logic."""

import logging
from datetime import datetime
from typing import Dict

from .config import AssessmentConfig
from .providers.base import ProviderInterface
from .metrics.base import MetricRegistry
from .types import AssessmentSummary


class CERTAgentEngine:
    """CERT Framework agent assessment engine with pluggable metrics.

    This engine orchestrates assessment execution across multiple providers
    and models, running configured metrics and aggregating results.
    """

    def __init__(
        self,
        config: AssessmentConfig,
        providers: Dict[str, ProviderInterface],
    ):
        """Initialize agent assessment engine.

        Args:
            config: Assessment configuration
            providers: Dict mapping provider names to ProviderInterface instances
        """
        self.config = config
        self.providers = providers
        self.logger = logging.getLogger(self.__class__.__name__)

        # Initialize enabled metrics
        self.metric_instances = {}
        self._initialize_metrics()

        # Results storage
        self.all_results = {}

    def _initialize_metrics(self):
        """Initialize all configured metrics from registry."""
        for metric_name in self.config.enabled_metrics:
            try:
                metric_class = MetricRegistry.get(metric_name)
                self.metric_instances[metric_name] = metric_class(
                    config={
                        "embedding_model": self.config.embedding_model_name,
                    }
                )
                self.logger.info(f"Initialized metric: {metric_name}")
            except ValueError as e:
                self.logger.warning(f"Skipping metric {metric_name}: {e}")

    async def run_full_assessment(
        self,
        test_consistency: bool = True,
        test_performance: bool = True,
        test_latency: bool = True,
        test_output_quality: bool = True,
        test_robustness: bool = True,
    ) -> AssessmentSummary:
        """Run complete assessment suite.

        Args:
            test_consistency: Run consistency tests
            test_performance: Run performance tests
            test_latency: Run latency tests
            test_output_quality: Run output quality tests
            test_robustness: Run robustness tests

        Returns:
            AssessmentSummary with all results
        """
        start_time = datetime.now()
        self.logger.info("=" * 60)
        self.logger.info("Starting CERT Agent Assessment Suite")
        self.logger.info("=" * 60)

        # Iterate over all provider/model combinations
        for provider_name, models in self.config.providers.items():
            if provider_name not in self.providers:
                self.logger.warning(f"Provider {provider_name} not available, skipping")
                continue

            for model in models:
                self.logger.info(f"\n>>> Testing {provider_name}/{model}")

                # Run consistency test
                if test_consistency and self.config.is_metric_enabled("consistency"):
                    await self._run_consistency_test(provider_name, model)

                # Run performance test
                if test_performance and self.config.is_metric_enabled("performance"):
                    await self._run_performance_test(provider_name, model)

                # Run latency test (implicitly done during consistency/performance)
                # Run output quality test
                # Run robustness test

        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()

        self.logger.info("=" * 60)
        self.logger.info(f"Assessment completed in {duration:.1f} seconds")
        self.logger.info("=" * 60)

        # Build summary
        summary = self._build_summary(start_time, end_time, duration)
        return summary

    async def _run_consistency_test(self, provider_name: str, model: str):
        """Run consistency test for a model."""
        if "consistency" not in self.metric_instances:
            return

        self.logger.info(
            f"  Testing consistency ({self.config.consistency_trials} trials)"
        )

        provider = self.providers[provider_name]
        responses = []
        timings = []
        metadata_list = []

        # Run trials
        for trial in range(self.config.consistency_trials):
            try:
                metadata = await provider.call_model(
                    model,
                    self.config.consistency_prompt,
                    max_tokens=self.config.max_tokens,
                    temperature=self.config.temperature,
                )
                responses.append(metadata.response_text)
                timings.append(metadata.latency_seconds)
                metadata_list.append(metadata)

                if (trial + 1) % 5 == 0:
                    self.logger.info(
                        f"    Completed trial {trial + 1}/{self.config.consistency_trials}"
                    )
            except Exception as e:
                self.logger.warning(f"    Trial {trial + 1} failed: {e}")

        # Calculate consistency metric
        if responses:
            try:
                consistency_metric = self.metric_instances["consistency"]
                result = await consistency_metric.calculate(
                    {
                        "responses": responses,
                        "provider": provider_name,
                        "model": model,
                    }
                )
                self.logger.info(
                    f"    Consistency score: {result.consistency_score:.3f}"
                )
            except Exception as e:
                self.logger.error(f"    Failed to calculate consistency: {e}")

        # Calculate latency metric if enabled
        if "latency" in self.metric_instances and timings:
            try:
                latency_metric = self.metric_instances["latency"]
                tokens_output = [m.tokens_output for m in metadata_list]
                result = await latency_metric.calculate(
                    {
                        "timings": timings,
                        "tokens_output": tokens_output,
                        "provider": provider_name,
                        "model": model,
                    }
                )
                self.logger.info(
                    f"    Latency (mean): {result.mean_latency_seconds:.2f}s"
                )
            except Exception as e:
                self.logger.error(f"    Failed to calculate latency: {e}")

        # Calculate output quality if enabled
        if "output_quality" in self.metric_instances and responses:
            try:
                quality_metric = self.metric_instances["output_quality"]
                result = await quality_metric.calculate(
                    {
                        "responses": responses,
                        "provider": provider_name,
                        "model": model,
                    }
                )
                self.logger.info(
                    f"    Output quality: diversity={result.semantic_diversity_score:.3f}, "
                    f"repetition={result.repetition_score:.3f}"
                )
            except Exception as e:
                self.logger.error(f"    Failed to calculate output quality: {e}")

        # Calculate robustness if enabled
        if "robustness" in self.metric_instances and metadata_list:
            try:
                robustness_metric = self.metric_instances["robustness"]
                result = await robustness_metric.calculate(
                    {
                        "metadata_list": metadata_list,
                        "provider": provider_name,
                        "model": model,
                    }
                )
                self.logger.info(
                    f"    Robustness: error_rate={result.error_rate:.1f}%, "
                    f"success={result.successful_trials}/{result.num_trials}"
                )
            except Exception as e:
                self.logger.error(f"    Failed to calculate robustness: {e}")

    async def _run_performance_test(self, provider_name: str, model: str):
        """Run performance test for a model."""
        if "performance" not in self.metric_instances:
            return

        self.logger.info(
            f"  Testing performance ({self.config.performance_trials} trials)"
        )

        provider = self.providers[provider_name]
        prompt_response_pairs = []

        # Run trials with different prompts
        for trial in range(self.config.performance_trials):
            prompt = self.config.performance_prompts[
                trial % len(self.config.performance_prompts)
            ]

            try:
                metadata = await provider.call_model(
                    model,
                    prompt,
                    max_tokens=self.config.max_tokens,
                    temperature=self.config.temperature,
                )
                prompt_response_pairs.append((prompt, metadata.response_text))

                if (trial + 1) % 5 == 0:
                    self.logger.info(
                        f"    Completed trial {trial + 1}/{self.config.performance_trials}"
                    )
            except Exception as e:
                self.logger.warning(f"    Trial {trial + 1} failed: {e}")

        # Calculate performance metric
        if prompt_response_pairs:
            try:
                performance_metric = self.metric_instances["performance"]
                result = await performance_metric.calculate(
                    {
                        "prompt_response_pairs": prompt_response_pairs,
                        "provider": provider_name,
                        "model": model,
                    }
                )
                self.logger.info(f"    Performance score: {result.mean_score:.3f}")
            except Exception as e:
                self.logger.error(f"    Failed to calculate performance: {e}")

    def _build_summary(
        self,
        start_time: datetime,
        end_time: datetime,
        duration: float,
    ) -> AssessmentSummary:
        """Build assessment summary from all results.

        Args:
            start_time: Assessment start time
            end_time: Assessment end time
            duration: Duration in seconds

        Returns:
            AssessmentSummary
        """
        from cert import __version__

        summary = AssessmentSummary(
            start_time=start_time.isoformat(),
            end_time=end_time.isoformat(),
            duration_seconds=duration,
            framework_version=__version__,
        )

        # Collect results from each metric
        for metric_name, metric_instance in self.metric_instances.items():
            if metric_name == "consistency":
                summary.consistency_results = metric_instance.results
            elif metric_name == "performance":
                summary.performance_results = metric_instance.results
            elif metric_name == "latency":
                summary.latency_results = metric_instance.results
            elif metric_name == "output_quality":
                summary.output_quality_results = metric_instance.results
            elif metric_name == "robustness":
                summary.robustness_results = metric_instance.results

        return summary


# Backward compatibility alias
CERTBenchmarkEngine = CERTAgentEngine
