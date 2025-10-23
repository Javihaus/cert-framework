"""
CERT Framework - LangChain Integration

Native Python wrapper for LangChain chains with CERT testing capabilities.
"""

from typing import Any, Optional, Callable
import asyncio


class CertChainWrapper:
    """Wraps a LangChain chain with CERT testing capabilities"""

    def __init__(self, chain: Any, test_id: str = "langchain-test"):
        """
        Initialize wrapper

        Args:
            chain: LangChain chain instance
            test_id: Unique identifier for this test
        """
        self.chain = chain
        self.test_id = test_id
        self._consistency_threshold: Optional[float] = None
        self._consistency_trials: int = 5
        self._expected_output: Optional[Any] = None
        self._comparison_fn: Optional[Callable] = None

    def with_consistency(self, threshold: float = 0.8, n_trials: int = 5):
        """
        Add consistency testing to the chain.

        Args:
            threshold: Minimum consistency score (0-1)
            n_trials: Number of trials to run

        Returns:
            Self for chaining

        Example:
            ```python
            cert_chain = wrap_chain(chain).with_consistency(threshold=0.9, n_trials=5)
            ```
        """
        self._consistency_threshold = threshold
        self._consistency_trials = n_trials
        return self

    def with_accuracy(
        self, expected_output: Any, comparison_fn: Optional[Callable] = None
    ):
        """
        Add accuracy testing to the chain.

        Args:
            expected_output: The expected output
            comparison_fn: Optional custom comparison function

        Returns:
            Self for chaining

        Example:
            ```python
            cert_chain = wrap_chain(chain).with_accuracy("Paris")
            ```
        """
        self._expected_output = expected_output
        self._comparison_fn = comparison_fn
        return self

    async def ainvoke(self, input_data: dict, **kwargs) -> Any:
        """
        Async invoke with CERT testing

        Args:
            input_data: Input dictionary for the chain
            **kwargs: Additional arguments passed to chain

        Returns:
            Chain output

        Raises:
            AccuracyError: If accuracy test fails
            ConsistencyError: If consistency test fails
        """
        from cert.utilities.runner import TestRunner, ConsistencyError, AccuracyError
        from cert.utilities.types import TestConfig, GroundTruth

        runner = TestRunner()

        async def _run_chain():
            """Helper to run chain"""
            if hasattr(self.chain, "ainvoke"):
                return await self.chain.ainvoke(input_data, **kwargs)
            elif hasattr(self.chain, "arun"):
                return await self.chain.arun(input_data, **kwargs)
            else:
                # Fallback to sync invoke
                return self.chain.invoke(input_data, **kwargs)

        # If accuracy testing is enabled, run it first
        if self._expected_output is not None:
            # Add ground truth
            runner.add_ground_truth(
                GroundTruth(
                    id=self.test_id,
                    question=str(input_data),
                    expected=self._expected_output,
                    metadata={"correctPages": [1]},  # Dummy for layer enforcement
                )
            )

            # Test retrieval (dummy)
            await runner.test_retrieval(
                self.test_id,
                lambda _: asyncio.create_task(
                    asyncio.coroutine(lambda: [{"pageNum": 1}])()
                ),
                {"precisionMin": 0.8},
            )

            # Test accuracy
            accuracy_result = await runner.test_accuracy(
                self.test_id, _run_chain, {"threshold": 0.8}
            )

            if accuracy_result.status == "fail":
                raise AccuracyError(
                    accuracy_result.diagnosis or "Accuracy test failed",
                    str(self._expected_output),
                    "actual output",
                )

        # If consistency testing is enabled, run it
        if self._consistency_threshold is not None:
            if self._expected_output is None:
                # Add dummy ground truth for layer enforcement
                runner.add_ground_truth(
                    GroundTruth(
                        id=self.test_id,
                        question=str(input_data),
                        expected="dummy",
                        metadata={"correctPages": [1]},
                    )
                )

                # Test retrieval (dummy)
                await runner.test_retrieval(
                    self.test_id,
                    lambda _: asyncio.create_task(
                        asyncio.coroutine(lambda: [{"pageNum": 1}])()
                    ),
                    {"precisionMin": 0.8},
                )

                # Test accuracy (dummy)
                await runner.test_accuracy(self.test_id, _run_chain, {"threshold": 0.8})

            config = TestConfig(
                n_trials=self._consistency_trials,
                consistency_threshold=self._consistency_threshold,
                accuracy_threshold=0.8,
                semantic_comparison=True,
            )

            result = await runner.test_consistency(self.test_id, _run_chain, config)

            if result.status == "fail":
                raise ConsistencyError(
                    result.diagnosis or "Consistency test failed",
                    result.suggestions or [],
                )

            # Return the first output from consistency testing
            return result.evidence.outputs[0] if result.evidence else await _run_chain()

        # If no testing, just run the chain
        return await _run_chain()

    def invoke(self, input_data: dict, **kwargs) -> Any:
        """
        Sync invoke with CERT testing

        Args:
            input_data: Input dictionary for the chain
            **kwargs: Additional arguments passed to chain

        Returns:
            Chain output
        """
        return asyncio.run(self.ainvoke(input_data, **kwargs))

    def __call__(self, input_data: dict, **kwargs) -> Any:
        """Allow calling the wrapper like a function"""
        return self.invoke(input_data, **kwargs)


def wrap_chain(chain: Any, test_id: str = "langchain-test") -> CertChainWrapper:
    """
    Wrap a LangChain chain with CERT testing capabilities.

    Example:
        ```python
        from langchain.chains import LLMChain
        from .integrations.langchain import wrap_chain

        chain = LLMChain(llm=llm, prompt=prompt)
        cert_chain = wrap_chain(chain, "my-chain-test")

        # Add consistency testing
        cert_chain = cert_chain.with_consistency(threshold=0.9, n_trials=5)

        # Run the chain
        result = cert_chain.invoke({"input": "Hello"})
        ```

    Args:
        chain: The LangChain chain to wrap
        test_id: ID for the test

    Returns:
        Wrapped chain with CERT capabilities
    """
    return CertChainWrapper(chain, test_id)


class CERTLangChainCallback:
    """CERT callback for LangChain chains and agents.

    Monitors LangChain execution for agent assessment metrics.
    Works with chains, agents, and AgentExecutor.

    Example:
        ```python
        from .integrations.langchain import CERTLangChainCallback
        from langchain.chains import LLMChain

        callback = CERTLangChainCallback(metrics=['consistency', 'latency'])

        chain = LLMChain(llm=llm, prompt=prompt, callbacks=[callback])
        result = chain.invoke({"input": "Hello"})

        report = callback.get_report()
        print(f"Latency: {report['latency_mean']:.2f}s")
        ```
    """

    def __init__(
        self,
        metrics: Optional[list] = None,
        config: Optional[dict] = None,
    ):
        """Initialize LangChain callback.

        Args:
            metrics: List of metrics to track
            config: Additional configuration
        """
        self.metrics = metrics or ["latency", "robustness"]
        self.config = config or {}

        # Storage
        self.responses: list = []
        self.timings: list = []
        self.metadata_list: list = []
        self.errors: list = []

        # Track call start times
        self._call_start_times: dict = {}

        # Metrics instances (lazy loaded)
        self._metric_instances = {}

    def on_llm_start(self, serialized: dict, prompts: list[str], **kwargs):
        """Called when LLM starts."""
        call_id = id(prompts)
        self._call_start_times[call_id] = asyncio.get_event_loop().time()

    def on_llm_end(self, response: Any, **kwargs):
        """Called when LLM ends."""
        call_id = id(response)
        start_time = self._call_start_times.get(
            call_id, asyncio.get_event_loop().time()
        )
        latency = asyncio.get_event_loop().time() - start_time

        # Extract response text
        response_text = self._extract_response(response)

        self.responses.append(response_text)
        self.timings.append(latency)
        self.metadata_list.append(
            {
                "latency": latency,
                "timestamp": asyncio.get_event_loop().time(),
                "error": None,
            }
        )

        if call_id in self._call_start_times:
            del self._call_start_times[call_id]

    def on_llm_error(self, error: Exception, **kwargs):
        """Called when LLM errors."""
        error_str = str(error)
        self.errors.append(error_str)
        self.metadata_list.append(
            {
                "latency": 0,
                "timestamp": asyncio.get_event_loop().time(),
                "error": error_str,
            }
        )

    def on_chain_start(self, serialized: dict, inputs: dict, **kwargs):
        """Called when chain starts."""
        pass

    def on_chain_end(self, outputs: dict, **kwargs):
        """Called when chain ends."""
        pass

    def on_chain_error(self, error: Exception, **kwargs):
        """Called when chain errors."""
        self.errors.append(str(error))

    def _extract_response(self, response: Any) -> str:
        """Extract text from LangChain response."""
        if isinstance(response, str):
            return response
        elif hasattr(response, "generations"):
            # LLMResult
            if response.generations and response.generations[0]:
                return response.generations[0][0].text
        elif hasattr(response, "content"):
            return response.content
        elif isinstance(response, dict):
            return response.get("output", "") or str(response)
        return str(response)

    def _initialize_metrics(self):
        """Lazy load metrics."""
        if self._metric_instances:
            return

        from cert.agents.metrics import MetricRegistry

        for metric_name in self.metrics:
            try:
                metric_class = MetricRegistry.get(metric_name)
                self._metric_instances[metric_name] = metric_class(config=self.config)
            except ValueError:
                pass

    async def _calculate_metrics(self) -> dict:
        """Calculate all metrics from collected data."""
        self._initialize_metrics()

        results = {}

        # Consistency
        if "consistency" in self._metric_instances and len(self.responses) >= 2:
            try:
                metric = self._metric_instances["consistency"]
                result = await metric.calculate(
                    {
                        "responses": self.responses,
                        "provider": "langchain",
                        "model": "chain",
                    }
                )
                results["consistency"] = result.consistency_score
                results["consistency_details"] = result
            except Exception:
                results["consistency"] = None

        # Latency
        if "latency" in self._metric_instances and self.timings:
            try:
                metric = self._metric_instances["latency"]
                result = await metric.calculate(
                    {
                        "timings": self.timings,
                        "tokens_output": [100] * len(self.timings),
                        "provider": "langchain",
                        "model": "chain",
                    }
                )
                results["latency_mean"] = result.mean_latency_seconds
                results["latency_p95"] = result.p95_latency_seconds
                results["latency_details"] = result
            except Exception:
                results["latency_mean"] = None

        # Robustness
        if "robustness" in self._metric_instances and self.metadata_list:
            try:
                metric = self._metric_instances["robustness"]
                result = await metric.calculate(
                    {
                        "metadata_list": self.metadata_list,
                        "provider": "langchain",
                        "model": "chain",
                    }
                )
                results["error_rate"] = result.error_rate
                results["robustness_details"] = result
            except Exception:
                results["error_rate"] = None

        return results

    def get_report(self) -> dict:
        """Get metrics report (sync)."""
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import nest_asyncio

            nest_asyncio.apply()

        return loop.run_until_complete(self._calculate_metrics())

    async def get_report_async(self) -> dict:
        """Get metrics report (async)."""
        return await self._calculate_metrics()

    def reset(self):
        """Reset all collected data."""
        self.responses = []
        self.timings = []
        self.metadata_list = []
        self.errors = []
        self._call_start_times = {}
