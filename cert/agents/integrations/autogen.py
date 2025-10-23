"""AutoGen integration for CERT framework.

Provides monitoring capabilities for AutoGen multi-agent conversations.
Tracks consistency, latency, and robustness metrics for agent interactions.
"""

import time
from typing import Any, Dict, List, Optional, Union

try:
    from autogen import Agent, ConversableAgent, GroupChat  # noqa: F401
except ImportError:
    raise ImportError("AutoGen not installed. Install with: pip install pyautogen")


class CERTAutoGenMonitor:
    """CERT monitor for AutoGen agent conversations.

    Supports both sync and async AutoGen conversations.
    Tracks agent responses for quality assessment.

    Example (sync):
        ```python
        from .integrations.autogen import CERTAutoGenMonitor
        from autogen import AssistantAgent, UserProxyAgent

        monitor = CERTAutoGenMonitor(metrics=['consistency', 'latency'])

        assistant = AssistantAgent("assistant", llm_config={...})
        user_proxy = UserProxyAgent("user_proxy")

        # Monitor automatically tracks conversation
        monitor.attach(assistant)

        user_proxy.initiate_chat(assistant, message="Hello!")

        # Get metrics report
        report = monitor.get_report()
        print(f"Consistency: {report['consistency']:.3f}")
        ```

    Example (async):
        ```python
        monitor = CERTAutoGenMonitor(metrics=['latency', 'robustness'])
        monitor.attach(assistant)

        await user_proxy.a_initiate_chat(assistant, message="Hello!")
        report = await monitor.get_report_async()
        ```
    """

    def __init__(
        self,
        metrics: Optional[List[str]] = None,
        config: Optional[Dict[str, Any]] = None,
    ):
        """Initialize AutoGen monitor.

        Args:
            metrics: List of metrics to track (consistency, latency, robustness, output_quality)
            config: Additional configuration (embedding_model, etc.)
        """
        self.metrics = metrics or ["consistency", "latency", "robustness"]
        self.config = config or {}

        # Storage for captured data
        self.responses: List[str] = []
        self.timings: List[float] = []
        self.metadata_list: List[Dict[str, Any]] = []
        self.errors: List[str] = []

        # Metrics instances (lazy loaded)
        self._metric_instances = {}

        # Track original methods for restoration
        self._original_methods: Dict[Agent, Dict[str, Any]] = {}

    def attach(self, agent: Union[Agent, ConversableAgent]):
        """Attach monitor to an AutoGen agent.

        Intercepts agent's generate_reply method to capture metrics.

        Args:
            agent: AutoGen Agent or ConversableAgent to monitor
        """
        if agent in self._original_methods:
            return  # Already attached

        # Store original method
        original_generate_reply = agent.generate_reply

        # Create wrapper
        def monitored_generate_reply(messages=None, sender=None, config=None):
            start_time = time.time()
            error = None

            try:
                # Call original method
                reply = original_generate_reply(messages, sender, config)
                latency = time.time() - start_time

                # Extract response text
                response_text = self._extract_response_text(reply)

                # Store data
                self.responses.append(response_text)
                self.timings.append(latency)
                self.metadata_list.append(
                    {
                        "latency": latency,
                        "agent": agent.name,
                        "sender": sender.name if sender else None,
                        "timestamp": time.time(),
                        "error": None,
                    }
                )

                return reply

            except Exception as e:
                latency = time.time() - start_time
                error = str(e)
                self.errors.append(error)
                self.timings.append(latency)
                self.metadata_list.append(
                    {
                        "latency": latency,
                        "agent": agent.name,
                        "sender": sender.name if sender else None,
                        "timestamp": time.time(),
                        "error": error,
                    }
                )
                raise

        # Store original and replace
        self._original_methods[agent] = {"generate_reply": original_generate_reply}
        agent.generate_reply = monitored_generate_reply

    async def attach_async(self, agent: Union[Agent, ConversableAgent]):
        """Attach monitor to an AutoGen agent (async version).

        Args:
            agent: AutoGen Agent to monitor
        """
        if agent in self._original_methods:
            return

        # Store original async method
        original_a_generate_reply = agent.a_generate_reply

        # Create async wrapper
        async def monitored_a_generate_reply(messages=None, sender=None, config=None):
            start_time = time.time()
            error = None

            try:
                # Call original async method
                reply = await original_a_generate_reply(messages, sender, config)
                latency = time.time() - start_time

                # Extract response text
                response_text = self._extract_response_text(reply)

                # Store data
                self.responses.append(response_text)
                self.timings.append(latency)
                self.metadata_list.append(
                    {
                        "latency": latency,
                        "agent": agent.name,
                        "sender": sender.name if sender else None,
                        "timestamp": time.time(),
                        "error": None,
                    }
                )

                return reply

            except Exception as e:
                latency = time.time() - start_time
                error = str(e)
                self.errors.append(error)
                self.timings.append(latency)
                self.metadata_list.append(
                    {
                        "latency": latency,
                        "agent": agent.name,
                        "sender": sender.name if sender else None,
                        "timestamp": time.time(),
                        "error": error,
                    }
                )
                raise

        # Store original and replace
        self._original_methods[agent] = {"a_generate_reply": original_a_generate_reply}
        agent.a_generate_reply = monitored_a_generate_reply

    def detach(self, agent: Union[Agent, ConversableAgent]):
        """Detach monitor from agent, restoring original methods.

        Args:
            agent: Agent to detach from
        """
        if agent not in self._original_methods:
            return

        # Restore original methods
        originals = self._original_methods[agent]
        for method_name, original_method in originals.items():
            setattr(agent, method_name, original_method)

        del self._original_methods[agent]

    def _extract_response_text(self, reply: Any) -> str:
        """Extract text from various AutoGen reply formats.

        Args:
            reply: AutoGen reply (string, dict, or list)

        Returns:
            Extracted text
        """
        if isinstance(reply, str):
            return reply
        elif isinstance(reply, dict):
            return reply.get("content", "") or str(reply)
        elif isinstance(reply, list):
            return " ".join([self._extract_response_text(r) for r in reply])
        else:
            return str(reply)

    def _initialize_metrics(self):
        """Lazy load metrics from cert.agents.metrics."""
        if self._metric_instances:
            return  # Already initialized

        from cert.agents.metrics import MetricRegistry

        for metric_name in self.metrics:
            try:
                metric_class = MetricRegistry.get(metric_name)
                self._metric_instances[metric_name] = metric_class(config=self.config)
            except ValueError:
                pass  # Metric not available

    async def _calculate_metrics(self) -> Dict[str, Any]:
        """Calculate all enabled metrics from collected data.

        Returns:
            Dictionary with metric results
        """
        self._initialize_metrics()

        results = {}

        # Consistency metric
        if "consistency" in self._metric_instances and len(self.responses) >= 2:
            try:
                metric = self._metric_instances["consistency"]
                result = await metric.calculate(
                    {
                        "responses": self.responses,
                        "provider": "autogen",
                        "model": "multi-agent",
                    }
                )
                results["consistency"] = result.consistency_score
                results["consistency_details"] = result
            except Exception:
                results["consistency"] = None

        # Latency metric
        if "latency" in self._metric_instances and self.timings:
            try:
                metric = self._metric_instances["latency"]
                result = await metric.calculate(
                    {
                        "timings": self.timings,
                        "tokens_output": [100] * len(self.timings),  # Estimate
                        "provider": "autogen",
                        "model": "multi-agent",
                    }
                )
                results["latency_mean"] = result.mean_latency_seconds
                results["latency_p95"] = result.p95_latency_seconds
                results["latency_details"] = result
            except Exception:
                results["latency_mean"] = None

        # Robustness metric
        if "robustness" in self._metric_instances and self.metadata_list:
            try:
                metric = self._metric_instances["robustness"]
                result = await metric.calculate(
                    {
                        "metadata_list": self.metadata_list,
                        "provider": "autogen",
                        "model": "multi-agent",
                    }
                )
                results["error_rate"] = result.error_rate
                results["robustness_details"] = result
            except Exception:
                results["error_rate"] = None

        # Output quality metric
        if "output_quality" in self._metric_instances and len(self.responses) >= 2:
            try:
                metric = self._metric_instances["output_quality"]
                result = await metric.calculate(
                    {
                        "responses": self.responses,
                        "provider": "autogen",
                        "model": "multi-agent",
                    }
                )
                results["output_quality"] = result.semantic_diversity_score
                results["output_quality_details"] = result
            except Exception:
                results["output_quality"] = None

        return results

    def get_report(self) -> Dict[str, Any]:
        """Get metrics report (sync version).

        Returns:
            Dictionary with all metric results
        """
        import asyncio

        loop = asyncio.get_event_loop()
        if loop.is_running():
            # Already in async context, need to use nest_asyncio
            import nest_asyncio

            nest_asyncio.apply()

        return loop.run_until_complete(self._calculate_metrics())

    async def get_report_async(self) -> Dict[str, Any]:
        """Get metrics report (async version).

        Returns:
            Dictionary with all metric results
        """
        return await self._calculate_metrics()

    def reset(self):
        """Reset all collected data."""
        self.responses = []
        self.timings = []
        self.metadata_list = []
        self.errors = []

    def detach_all(self):
        """Detach from all monitored agents."""
        for agent in list(self._original_methods.keys()):
            self.detach(agent)
