"""
Multi-agent coordination orchestrator.

Supports:
- Sequential coordination (chain-of-agents)
- Parallel coordination with aggregation
- Debate coordination
"""

import asyncio
import logging
import time
from datetime import datetime
from typing import List, Optional, Tuple

from cert.advanced.coordination.types import AgentResponse, CoordinationMetrics
from cert.advanced.coordination.client import AnthropicClientWithResilience
from cert.advanced.coordination.baseline import BaselineMeasurer
from cert.advanced.coordination.evaluator import QualityEvaluator
from cert.observability.metrics import MetricsCollector

logger = logging.getLogger(__name__)


class CoordinationOrchestrator:
    """Orchestrate multi-agent coordination measurement."""

    def __init__(
        self,
        client: AnthropicClientWithResilience,
        baseline_measurer: BaselineMeasurer,
        evaluator: QualityEvaluator,
        metrics: Optional[MetricsCollector] = None,
    ):
        """
        Initialize coordination orchestrator.

        Args:
            client: Anthropic API client
            baseline_measurer: Baseline measurer
            evaluator: Quality evaluator
            metrics: Optional metrics collector
        """
        self._client = client
        self._baseline_measurer = baseline_measurer
        self._evaluator = evaluator
        self._metrics = metrics or MetricsCollector()

    async def measure_coordination(
        self,
        task: str,
        num_agents: int,
        strategy: str = "sequential",
        model: str = "claude-3-5-sonnet-20241022",
        force_baseline_refresh: bool = False,
    ) -> CoordinationMetrics:
        """
        Measure coordination effectiveness.

        Args:
            task: Task description
            num_agents: Number of agents
            strategy: Coordination approach ("sequential", "parallel", "debate")
            model: Model to use
            force_baseline_refresh: Force baseline recalculation

        Returns:
            CoordinationMetrics with gamma, omega, etc.
        """
        logger.info(
            "Starting coordination measurement",
            extra={
                "task_length": len(task),
                "num_agents": num_agents,
                "strategy": strategy,
            },
        )

        start = time.time()

        # Step 1: Measure baseline (cached if available)
        baseline = await self._baseline_measurer.measure_baseline(
            task=task,
            num_agents=num_agents,
            force_refresh=force_baseline_refresh,
            model=model,
        )

        # Step 2: Run coordinated agents
        coordinated_response, agent_responses = await self._run_coordinated_agents(
            task=task,
            num_agents=num_agents,
            strategy=strategy,
            model=model,
        )

        # Step 3: Evaluate coordinated response quality
        coordinated_quality = await self._evaluator.evaluate_response(
            task=task,
            response=coordinated_response,
        )

        # Step 4: Compute coordination metrics
        baseline_quality = baseline.mean_quality
        best_individual_quality = max(baseline.quality_scores)

        # Gamma: coordination effect (coordinated / baseline)
        gamma = coordinated_quality / baseline_quality if baseline_quality > 0 else 1.0

        # Omega: emergence indicator (coordinated - best individual)
        omega = coordinated_quality - best_individual_quality

        # Consensus rate: agreement between agents
        consensus_rate = await self._compute_consensus_rate(agent_responses)

        metrics = CoordinationMetrics(
            gamma=gamma,
            omega=omega,
            consensus_rate=consensus_rate,
            baseline_quality=baseline_quality,
            coordinated_quality=coordinated_quality,
            best_individual_quality=best_individual_quality,
            agent_responses=agent_responses,
            coordinated_response=coordinated_response,
            task=task,
            num_agents=num_agents,
            strategy=strategy,
            timestamp=datetime.now(),
        )

        # Record metrics
        self._metrics.coordination_gamma.observe(gamma)

        duration = time.time() - start

        logger.info(
            "Coordination measurement complete",
            extra={
                "task_length": len(task),
                "gamma": gamma,
                "omega": omega,
                "consensus_rate": consensus_rate,
                "coordination_effective": metrics.is_coordination_effective(),
                "emergence_detected": metrics.has_emergence(),
                "duration_s": duration,
            },
        )

        return metrics

    async def _run_coordinated_agents(
        self,
        task: str,
        num_agents: int,
        strategy: str,
        model: str,
    ) -> Tuple[str, List[AgentResponse]]:
        """
        Run agents with coordination.

        Args:
            task: Task description
            num_agents: Number of agents
            strategy: Coordination strategy
            model: Model to use

        Returns:
            Tuple of (final_response, agent_responses)
        """
        if strategy == "sequential":
            return await self._sequential_coordination(task, num_agents, model)
        elif strategy == "parallel":
            return await self._parallel_coordination(task, num_agents, model)
        elif strategy == "debate":
            return await self._debate_coordination(task, num_agents, model)
        else:
            raise ValueError(f"Unknown coordination strategy: {strategy}")

    async def _sequential_coordination(
        self,
        task: str,
        num_agents: int,
        model: str,
    ) -> Tuple[str, List[AgentResponse]]:
        """
        Sequential coordination (chain-of-agents).

        Each agent builds on the previous agent's output.

        Args:
            task: Task description
            num_agents: Number of agents
            model: Model to use

        Returns:
            Tuple of (final_response, agent_responses)
        """
        logger.debug(f"Running sequential coordination with {num_agents} agents")

        responses = []
        current_output = task

        for i in range(num_agents):
            prompt = f"""Task: {task}

Previous agent's work: {current_output if i > 0 else "None (you are first)"}

Your task: {"Provide an initial solution" if i == 0 else "Review the previous work and improve it. Build on what's correct, fix what's wrong."}

Provide your response:"""

            response_text = await self._client.complete(
                prompt=prompt,
                agent_id=f"sequential_agent_{i}",
                model=model,
            )

            response = AgentResponse(
                agent_id=f"sequential_agent_{i}",
                response=response_text,
                metadata={"position": i, "strategy": "sequential"},
                timestamp=datetime.now(),
            )
            responses.append(response)

            current_output = response_text

        # Final output is last agent's response
        final_response = current_output

        return final_response, responses

    async def _parallel_coordination(
        self,
        task: str,
        num_agents: int,
        model: str,
    ) -> Tuple[str, List[AgentResponse]]:
        """
        Parallel coordination with aggregation.

        All agents work independently, then results are aggregated.

        Args:
            task: Task description
            num_agents: Number of agents
            model: Model to use

        Returns:
            Tuple of (final_response, agent_responses)
        """
        logger.debug(f"Running parallel coordination with {num_agents} agents")

        # Query all agents in parallel
        tasks = [
            self._client.complete(
                prompt=task,
                agent_id=f"parallel_agent_{i}",
                model=model,
            )
            for i in range(num_agents)
        ]

        response_texts = await asyncio.gather(*tasks)

        responses = [
            AgentResponse(
                agent_id=f"parallel_agent_{i}",
                response=text,
                metadata={"strategy": "parallel"},
                timestamp=datetime.now(),
            )
            for i, text in enumerate(response_texts)
        ]

        # Aggregate responses
        aggregation_prompt = f"""Task: {task}

Multiple agents have provided responses. Your job is to synthesize them into a single high-quality response.

Agent responses:
{chr(10).join(f"Agent {i + 1}: {r.response}" for i, r in enumerate(responses))}

Synthesize these responses into a single, comprehensive answer that combines the best insights from all agents:"""

        final_response = await self._client.complete(
            prompt=aggregation_prompt,
            agent_id="aggregator",
            model=model,
        )

        return final_response, responses

    async def _debate_coordination(
        self,
        task: str,
        num_agents: int,
        model: str,
        rounds: int = 2,
    ) -> Tuple[str, List[AgentResponse]]:
        """
        Debate coordination.

        Agents debate back and forth, then produce final consensus.

        Args:
            task: Task description
            num_agents: Number of agents (typically 2-3)
            model: Model to use
            rounds: Number of debate rounds

        Returns:
            Tuple of (final_response, agent_responses)
        """
        logger.debug(
            f"Running debate coordination with {num_agents} agents for {rounds} rounds"
        )

        all_responses = []

        # Initial responses
        initial_tasks = [
            self._client.complete(
                prompt=f"Task: {task}\n\nProvide your initial response:",
                agent_id=f"debate_agent_{i}",
                model=model,
            )
            for i in range(num_agents)
        ]

        initial_texts = await asyncio.gather(*initial_tasks)

        for i, text in enumerate(initial_texts):
            response = AgentResponse(
                agent_id=f"debate_agent_{i}",
                response=text,
                metadata={"round": 0, "strategy": "debate"},
                timestamp=datetime.now(),
            )
            all_responses.append(response)

        # Debate rounds
        current_positions = initial_texts

        for round_num in range(1, rounds + 1):
            new_positions = []

            for i in range(num_agents):
                # Show this agent all other agents' positions
                other_positions = [
                    f"Agent {j}: {current_positions[j]}"
                    for j in range(num_agents)
                    if j != i
                ]

                debate_prompt = f"""Task: {task}

You are Agent {i}. Here are the other agents' positions:
{chr(10).join(other_positions)}

Your previous position: {current_positions[i]}

Consider the other positions and refine your answer. You may:
- Strengthen your arguments
- Address counterpoints
- Change your position if convinced
- Synthesize ideas from multiple positions

Provide your refined response:"""

                refined_text = await self._client.complete(
                    prompt=debate_prompt,
                    agent_id=f"debate_agent_{i}_round_{round_num}",
                    model=model,
                )

                response = AgentResponse(
                    agent_id=f"debate_agent_{i}",
                    response=refined_text,
                    metadata={"round": round_num, "strategy": "debate"},
                    timestamp=datetime.now(),
                )
                all_responses.append(response)
                new_positions.append(refined_text)

            current_positions = new_positions

        # Final consensus
        consensus_prompt = f"""Task: {task}

After {rounds} rounds of debate, the agents' final positions are:
{chr(10).join(f"Agent {i}: {pos}" for i, pos in enumerate(current_positions))}

Synthesize these positions into a final consensus answer:"""

        final_response = await self._client.complete(
            prompt=consensus_prompt,
            agent_id="consensus_builder",
            model=model,
        )

        return final_response, all_responses

    async def _compute_consensus_rate(self, responses: List[AgentResponse]) -> float:
        """
        Compute consensus rate between agents using semantic similarity.

        Args:
            responses: List of agent responses

        Returns:
            Consensus rate (0-1)
        """
        if len(responses) < 2:
            return 1.0

        # Use CERT's measure function for semantic similarity
        from cert.measure import measure

        texts = [r.response for r in responses]

        # Compute pairwise similarities
        similarities = []
        for i in range(len(texts)):
            for j in range(i + 1, len(texts)):
                try:
                    result = measure(texts[i], texts[j])
                    similarities.append(result.semantic_similarity)
                except Exception as e:
                    logger.warning(f"Failed to compute similarity: {e}")
                    similarities.append(0.5)  # Default

        consensus = sum(similarities) / len(similarities) if similarities else 0.0

        return consensus
