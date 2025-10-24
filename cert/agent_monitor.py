"""Agent monitoring function for LLM model assessment.

This module provides the agent_monitor() function for comprehensive monitoring
of LLM agents/models across multiple trials and metrics.
"""

import asyncio
import logging
import os
import time
from datetime import datetime
from typing import List, Optional

from cert.core.providers import get_provider
from cert.core.types import AgentMonitorResult
from cert.metrics import (
    calculate_consistency,
    calculate_latency,
    calculate_output_quality,
    calculate_performance,
    calculate_robustness,
)

logger = logging.getLogger(__name__)


def agent_monitor(
    *,
    provider: str,
    model: str,
    consistency_trials: int = 20,
    performance_trials: int = 15,
    temperature: float = 0.0,
    max_tokens: int = 1024,
    timeout: int = 30,
    consistency_prompt: Optional[str] = None,
    performance_prompts: Optional[List[str]] = None,
    enabled_metrics: Optional[List[str]] = None,
    embedding_model: str = "all-MiniLM-L6-v2",
    random_seed: int = 42,
    api_key: Optional[str] = None,
    **kwargs,
) -> AgentMonitorResult:
    """Monitor agent/model performance across multiple trials.

    Measures behavioral reliability, output quality, response time, and robustness
    by running multiple trials and computing comprehensive metrics.

    Args:
        provider: Provider name (openai, anthropic, google, xai, huggingface)
        model: Model identifier (e.g., "gpt-4o", "claude-3-5-sonnet-20241022")
        consistency_trials: Number of consistency test trials (min 10)
        performance_trials: Number of performance test trials (min 5)
        temperature: Sampling temperature (0.0=deterministic, 1.0=creative)
        max_tokens: Maximum output tokens
        timeout: Request timeout in seconds
        consistency_prompt: Custom prompt for consistency testing
        performance_prompts: List of prompts for performance testing
        enabled_metrics: Metrics to compute (default: all)
        embedding_model: Model for semantic similarity
        random_seed: Random seed for reproducibility
        api_key: API key (if not in environment)
        **kwargs: Provider-specific parameters

    Returns:
        AgentMonitorResult with:
            - provider: str
            - model: str
            - consistency: ConsistencyMetric (if enabled)
            - performance: PerformanceMetric (if enabled)
            - latency: LatencyMetric (if enabled)
            - output_quality: OutputQualityMetric (if enabled)
            - robustness: RobustnessMetric (if enabled)
            - config: dict (configuration used)
            - duration_seconds: float
            - timestamp: str

    Raises:
        ValueError: Invalid provider, model, or configuration
        RuntimeError: API key missing or API errors

    Examples:
        # Monitor single model
        result = agent_monitor(
            provider="openai",
            model="gpt-4o",
            consistency_trials=20,
            temperature=0.0
        )
        print(f"Consistency: {result.consistency.score:.3f}")

        # Quick consistency check
        result = agent_monitor(
            provider="anthropic",
            model="claude-3-5-sonnet-20241022",
            consistency_trials=10,
            enabled_metrics=["consistency", "latency"]
        )

        # Full monitoring suite
        result = agent_monitor(
            provider="google",
            model="gemini-2.0-flash-exp",
            consistency_trials=30,
            performance_trials=20,
            temperature=0.0,
            enabled_metrics=["consistency", "performance", "latency",
                           "output_quality", "robustness"]
        )

        # Export to DataFrame
        df = result.to_dataframe()
        df.to_csv("monitoring_results.csv")
    """
    start_time = time.time()
    start_timestamp = datetime.now()

    # Validate trials
    if consistency_trials < 10:
        raise ValueError(
            f"consistency_trials must be >= 10 for statistical significance, "
            f"got {consistency_trials}"
        )
    if performance_trials < 5:
        raise ValueError(
            f"performance_trials must be >= 5, got {performance_trials}"
        )

    # Default enabled metrics
    if enabled_metrics is None:
        enabled_metrics = ["consistency", "performance", "latency",
                          "output_quality", "robustness"]

    # Validate metrics
    valid_metrics = {"consistency", "performance", "latency", "output_quality", "robustness"}
    for metric in enabled_metrics:
        if metric not in valid_metrics:
            raise ValueError(
                f"Invalid metric '{metric}'. Valid: {valid_metrics}"
            )

    # Default prompts
    if consistency_prompt is None:
        consistency_prompt = (
            "Analyze the key factors in effective business strategy implementation. "
            "Provide a concise, structured response."
        )

    if performance_prompts is None:
        performance_prompts = [
            "Analyze the key factors in business strategy",
            "Evaluate the main considerations for project management",
            "Assess the critical elements in organizational change",
            "Identify the primary aspects of market analysis",
            "Examine the essential components of risk assessment",
        ]

    logger.info(
        f"Starting agent monitoring: {provider}/{model} "
        f"(consistency={consistency_trials}, performance={performance_trials})"
    )

    # Initialize provider
    try:
        provider_instance = get_provider(
            provider_name=provider,
            api_key=api_key,
            timeout=timeout,
        )
        logger.info(f"Provider initialized: {provider}")
    except Exception as e:
        raise RuntimeError(f"Failed to initialize provider '{provider}': {e}")

    # Run async monitoring
    try:
        result = asyncio.run(
            _run_monitoring(
                provider_instance=provider_instance,
                model=model,
                consistency_trials=consistency_trials,
                performance_trials=performance_trials,
                temperature=temperature,
                max_tokens=max_tokens,
                consistency_prompt=consistency_prompt,
                performance_prompts=performance_prompts,
                enabled_metrics=enabled_metrics,
                embedding_model=embedding_model,
            )
        )
    except Exception as e:
        logger.error(f"Monitoring failed: {e}")
        raise RuntimeError(f"Agent monitoring failed: {e}")

    duration = time.time() - start_time

    logger.info(f"Monitoring complete in {duration:.1f}s")

    # Build final result
    final_result = AgentMonitorResult(
        provider=provider,
        model=model,
        consistency=result.get("consistency"),
        performance=result.get("performance"),
        latency=result.get("latency"),
        output_quality=result.get("output_quality"),
        robustness=result.get("robustness"),
        config={
            "consistency_trials": consistency_trials,
            "performance_trials": performance_trials,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "timeout": timeout,
            "enabled_metrics": enabled_metrics,
            "embedding_model": embedding_model,
            "random_seed": random_seed,
        },
        duration_seconds=duration,
        timestamp=start_timestamp.isoformat(),
    )

    return final_result


async def _run_monitoring(
    provider_instance,
    model: str,
    consistency_trials: int,
    performance_trials: int,
    temperature: float,
    max_tokens: int,
    consistency_prompt: str,
    performance_prompts: List[str],
    enabled_metrics: List[str],
    embedding_model: str,
):
    """Internal async function to run monitoring trials.

    Args:
        provider_instance: Provider instance
        model: Model name
        consistency_trials: Number of consistency trials
        performance_trials: Number of performance trials
        temperature: Temperature
        max_tokens: Max tokens
        consistency_prompt: Prompt for consistency
        performance_prompts: Prompts for performance
        enabled_metrics: Enabled metrics
        embedding_model: Embedding model name

    Returns:
        Dictionary with computed metrics
    """
    results = {}

    # Track for robustness
    total_successes = 0
    total_errors = 0
    total_timeouts = 0
    error_messages = []

    # === CONSISTENCY TESTING ===
    if "consistency" in enabled_metrics:
        logger.info(f"Running consistency test ({consistency_trials} trials)")

        consistency_responses = []
        consistency_latencies = []

        for trial in range(consistency_trials):
            try:
                response_metadata = await provider_instance.call_model(
                    model=model,
                    prompt=consistency_prompt,
                    max_tokens=max_tokens,
                    temperature=temperature,
                )

                if response_metadata.error:
                    logger.warning(f"Trial {trial + 1} failed: {response_metadata.error}")
                    total_errors += 1
                    error_messages.append(response_metadata.error)
                    if response_metadata.timeout:
                        total_timeouts += 1
                else:
                    consistency_responses.append(response_metadata.response_text)
                    consistency_latencies.append(response_metadata.latency_seconds)
                    total_successes += 1

                if (trial + 1) % 5 == 0:
                    logger.info(f"  Completed trial {trial + 1}/{consistency_trials}")

            except Exception as e:
                logger.warning(f"Trial {trial + 1} exception: {e}")
                total_errors += 1
                error_messages.append(str(e))

        # Calculate consistency
        if len(consistency_responses) >= 2:
            consistency_metric = calculate_consistency(
                responses=consistency_responses,
                embedding_model=embedding_model,
            )
            results["consistency"] = consistency_metric
            logger.info(f"Consistency: {consistency_metric.score:.3f}")
        else:
            logger.warning("Not enough responses for consistency calculation")

        # Calculate latency from consistency trials
        if "latency" in enabled_metrics and consistency_latencies:
            latency_metric = calculate_latency(
                latencies_seconds=consistency_latencies
            )
            results["latency"] = latency_metric
            logger.info(f"Latency: mean={latency_metric.mean_ms:.1f}ms")

        # Calculate output quality from consistency trials
        if "output_quality" in enabled_metrics and consistency_responses:
            output_quality_metric = calculate_output_quality(
                responses=consistency_responses,
                embedding_model=embedding_model,
            )
            results["output_quality"] = output_quality_metric
            logger.info(
                f"Output Quality: diversity={output_quality_metric.semantic_diversity:.3f}"
            )

    # === PERFORMANCE TESTING ===
    if "performance" in enabled_metrics:
        logger.info(f"Running performance test ({performance_trials} trials)")

        performance_pairs = []

        for trial in range(performance_trials):
            # Cycle through prompts
            prompt = performance_prompts[trial % len(performance_prompts)]

            try:
                response_metadata = await provider_instance.call_model(
                    model=model,
                    prompt=prompt,
                    max_tokens=max_tokens,
                    temperature=temperature,
                )

                if response_metadata.error:
                    logger.warning(f"Trial {trial + 1} failed: {response_metadata.error}")
                    total_errors += 1
                    error_messages.append(response_metadata.error)
                    if response_metadata.timeout:
                        total_timeouts += 1
                else:
                    performance_pairs.append((prompt, response_metadata.response_text))
                    total_successes += 1

                if (trial + 1) % 5 == 0:
                    logger.info(f"  Completed trial {trial + 1}/{performance_trials}")

            except Exception as e:
                logger.warning(f"Trial {trial + 1} exception: {e}")
                total_errors += 1
                error_messages.append(str(e))

        # Calculate performance
        if performance_pairs:
            performance_metric = calculate_performance(
                prompt_response_pairs=performance_pairs,
                embedding_model=embedding_model,
            )
            results["performance"] = performance_metric
            logger.info(f"Performance: {performance_metric.mean_score:.3f}")
        else:
            logger.warning("No valid performance pairs")

    # === ROBUSTNESS ===
    if "robustness" in enabled_metrics:
        total_trials = total_successes + total_errors
        if total_trials > 0:
            robustness_metric = calculate_robustness(
                successes=total_successes,
                errors=total_errors - total_timeouts,  # Exclude timeouts from errors
                timeouts=total_timeouts,
                error_messages=error_messages,
            )
            results["robustness"] = robustness_metric
            logger.info(f"Robustness: success_rate={robustness_metric.success_rate:.1%}")

    return results
