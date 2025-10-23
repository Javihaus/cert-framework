"""CrewAI integration for CERT framework.

Provides callback-based monitoring for CrewAI crews.
Tracks agent task execution quality and performance.
"""

import time
from typing import Any, Dict, List, Optional

try:
    from crewai import Agent, Crew, Task
except ImportError:
    raise ImportError("CrewAI not installed. Install with: pip install crewai")


class CERTCrewAICallback:
    """CERT callback for CrewAI crew monitoring.

    Integrates with CrewAI's callback system to track agent performance.
    Supports both sync and async crew execution.

    Example (sync):
        ```python
        from .integrations.crewai import CERTCrewAICallback
        from crewai import Crew, Agent, Task

        callback = CERTCrewAICallback(metrics=['consistency', 'latency'])

        crew = Crew(
            agents=[agent1, agent2],
            tasks=[task1, task2],
            callbacks=[callback]
        )

        result = crew.kickoff()
        report = callback.get_report()
        print(f"Latency P95: {report['latency_p95']:.2f}s")
        ```

    Example (async):
        ```python
        callback = CERTCrewAICallback(metrics=['robustness', 'performance'])

        crew = Crew(
            agents=[agent1, agent2],
            tasks=[task1, task2],
            callbacks=[callback]
        )

        result = await crew.kickoff_async()
        report = await callback.get_report_async()
        ```
    """

    def __init__(
        self,
        metrics: Optional[List[str]] = None,
        config: Optional[Dict[str, Any]] = None,
    ):
        """Initialize CrewAI callback.

        Args:
            metrics: List of metrics to track (consistency, latency, robustness, performance)
            config: Additional configuration
        """
        self.metrics = metrics or ["latency", "robustness", "performance"]
        self.config = config or {}

        # Storage for captured data
        self.task_responses: List[str] = []
        self.task_timings: List[float] = []
        self.task_metadata: List[Dict[str, Any]] = []
        self.task_errors: List[str] = []

        # Track task start times
        self._task_start_times: Dict[str, float] = {}

        # Metrics instances (lazy loaded)
        self._metric_instances = {}

    def on_task_start(self, task: Task, **kwargs):
        """Called when a task starts execution.

        Args:
            task: CrewAI Task object
            **kwargs: Additional arguments
        """
        task_id = id(task)
        self._task_start_times[task_id] = time.time()

    def on_task_end(self, task: Task, output: Any, **kwargs):
        """Called when a task completes.

        Args:
            task: CrewAI Task object
            output: Task output
            **kwargs: Additional arguments
        """
        task_id = id(task)
        start_time = self._task_start_times.get(task_id, time.time())
        latency = time.time() - start_time

        # Extract output text
        output_text = self._extract_output_text(output)

        # Store data
        self.task_responses.append(output_text)
        self.task_timings.append(latency)
        self.task_metadata.append(
            {
                "latency": latency,
                "task_description": task.description
                if hasattr(task, "description")
                else "",
                "agent": task.agent.role if hasattr(task, "agent") else None,
                "timestamp": time.time(),
                "error": None,
            }
        )

        # Clean up
        if task_id in self._task_start_times:
            del self._task_start_times[task_id]

    def on_task_error(self, task: Task, error: Exception, **kwargs):
        """Called when a task encounters an error.

        Args:
            task: CrewAI Task object
            error: Exception that occurred
            **kwargs: Additional arguments
        """
        task_id = id(task)
        start_time = self._task_start_times.get(task_id, time.time())
        latency = time.time() - start_time

        error_str = str(error)
        self.task_errors.append(error_str)
        self.task_timings.append(latency)
        self.task_metadata.append(
            {
                "latency": latency,
                "task_description": task.description
                if hasattr(task, "description")
                else "",
                "agent": task.agent.role if hasattr(task, "agent") else None,
                "timestamp": time.time(),
                "error": error_str,
            }
        )

        # Clean up
        if task_id in self._task_start_times:
            del self._task_start_times[task_id]

    def on_agent_action(self, agent: Agent, action: str, **kwargs):
        """Called when an agent takes an action.

        Args:
            agent: CrewAI Agent object
            action: Action description
            **kwargs: Additional arguments
        """
        # Optional: Track agent actions for more detailed monitoring
        pass

    def on_crew_start(self, crew: Crew, **kwargs):
        """Called when crew execution starts.

        Args:
            crew: CrewAI Crew object
            **kwargs: Additional arguments
        """
        self.reset()  # Reset data for new execution

    def on_crew_end(self, crew: Crew, output: Any, **kwargs):
        """Called when crew execution completes.

        Args:
            crew: CrewAI Crew object
            output: Final crew output
            **kwargs: Additional arguments
        """
        # Crew execution complete, data ready for reporting
        pass

    def _extract_output_text(self, output: Any) -> str:
        """Extract text from CrewAI task output.

        Args:
            output: Task output (various formats)

        Returns:
            Extracted text
        """
        if isinstance(output, str):
            return output
        elif hasattr(output, "raw_output"):
            return str(output.raw_output)
        elif hasattr(output, "result"):
            return str(output.result)
        elif isinstance(output, dict):
            return output.get("output", "") or str(output)
        else:
            return str(output)

    def _initialize_metrics(self):
        """Lazy load metrics from cert.agents.metrics."""
        if self._metric_instances:
            return

        from cert.agents.metrics import MetricRegistry

        for metric_name in self.metrics:
            try:
                metric_class = MetricRegistry.get(metric_name)
                self._metric_instances[metric_name] = metric_class(config=self.config)
            except ValueError:
                pass

    async def _calculate_metrics(self) -> Dict[str, Any]:
        """Calculate all enabled metrics from collected data.

        Returns:
            Dictionary with metric results
        """
        self._initialize_metrics()

        results = {
            "total_tasks": len(self.task_responses),
            "total_errors": len(self.task_errors),
        }

        # Consistency metric (for multi-task crews)
        if "consistency" in self._metric_instances and len(self.task_responses) >= 2:
            try:
                metric = self._metric_instances["consistency"]
                result = await metric.calculate(
                    {
                        "responses": self.task_responses,
                        "provider": "crewai",
                        "model": "crew",
                    }
                )
                results["consistency"] = result.consistency_score
                results["consistency_details"] = result
            except Exception:
                results["consistency"] = None

        # Latency metric
        if "latency" in self._metric_instances and self.task_timings:
            try:
                metric = self._metric_instances["latency"]
                result = await metric.calculate(
                    {
                        "timings": self.task_timings,
                        "tokens_output": [100] * len(self.task_timings),  # Estimate
                        "provider": "crewai",
                        "model": "crew",
                    }
                )
                results["latency_mean"] = result.mean_latency_seconds
                results["latency_p95"] = result.p95_latency_seconds
                results["latency_details"] = result
            except Exception:
                results["latency_mean"] = None

        # Robustness metric
        if "robustness" in self._metric_instances and self.task_metadata:
            try:
                metric = self._metric_instances["robustness"]
                result = await metric.calculate(
                    {
                        "metadata_list": self.task_metadata,
                        "provider": "crewai",
                        "model": "crew",
                    }
                )
                results["error_rate"] = result.error_rate
                results["success_rate"] = 100 - result.error_rate
                results["robustness_details"] = result
            except Exception:
                results["error_rate"] = None

        # Performance metric
        if "performance" in self._metric_instances and len(self.task_responses) >= 1:
            try:
                metric = self._metric_instances["performance"]
                # Create synthetic prompt-response pairs from task metadata
                pairs = []
                for i, response in enumerate(self.task_responses):
                    prompt = self.task_metadata[i].get("task_description", "Task")
                    pairs.append((prompt, response))

                result = await metric.calculate(
                    {
                        "prompt_response_pairs": pairs,
                        "provider": "crewai",
                        "model": "crew",
                    }
                )
                results["performance"] = result.mean_score
                results["performance_details"] = result
            except Exception:
                results["performance"] = None

        return results

    def get_report(self) -> Dict[str, Any]:
        """Get metrics report (sync version).

        Returns:
            Dictionary with all metric results
        """
        import asyncio

        loop = asyncio.get_event_loop()
        if loop.is_running():
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
        self.task_responses = []
        self.task_timings = []
        self.task_metadata = []
        self.task_errors = []
        self._task_start_times = {}
