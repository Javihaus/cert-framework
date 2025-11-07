"""
Offline evaluator for batch processing trace logs.

Separates evaluation from runtime monitoring for better performance.
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from cert.core.tracer import CertTracer


class Evaluator:
    """Offline evaluation layer - requires [evaluation] extras.

    Supports pluggable accuracy evaluators for domain-specific compliance:
    - SemanticEvaluator (default): General-purpose semantic similarity
    - ExactMatchEvaluator: Financial/medical/legal exact matching
    - Custom: Implement AccuracyEvaluator interface for your domain
    """

    def __init__(
        self,
        preset: str = "general",
        threshold: float = 0.7,
        tracer: Optional[CertTracer] = None,
        accuracy_evaluator: Optional[Any] = None,
    ):
        """Initialize evaluator with preset or custom accuracy evaluator.

        Args:
            preset: Industry preset (general, financial, healthcare, legal) - DEPRECATED if accuracy_evaluator provided
            threshold: Confidence threshold for pass/fail
            tracer: Optional tracer for logging evaluation results
            accuracy_evaluator: Custom AccuracyEvaluator instance (overrides preset)

        Requires:
            pip install cert-framework[evaluation]

        Examples:
            >>> # Default semantic evaluator
            >>> evaluator = Evaluator(threshold=0.7)
            >>>
            >>> # Exact match for financial domain
            >>> from cert.evaluation import ExactMatchEvaluator
            >>> evaluator = Evaluator(accuracy_evaluator=ExactMatchEvaluator())
            >>>
            >>> # Custom evaluator
            >>> class MyEvaluator(AccuracyEvaluator):
            ...     def evaluate(self, context, answer, threshold):
            ...         # Your domain logic here
            ...         return {"matched": True, "confidence": 0.95}
            >>> evaluator = Evaluator(accuracy_evaluator=MyEvaluator())
        """
        self.threshold = threshold
        self.preset = preset
        self.tracer = tracer or CertTracer()

        # Use custom evaluator if provided, otherwise default to semantic
        if accuracy_evaluator is not None:
            self.accuracy_evaluator = accuracy_evaluator
        else:
            # Import and instantiate default semantic evaluator
            try:
                from cert.evaluation.semantic import SemanticEvaluator
            except ImportError as e:
                raise ImportError(
                    f"Evaluator requires: pip install cert-framework[evaluation]\nOriginal error: {e}"
                )
            self.accuracy_evaluator = SemanticEvaluator()

        # For backwards compatibility, keep preset logic
        if preset != "general" and accuracy_evaluator is None:
            try:
                from cert.utils.presets import get_preset

                config = get_preset(preset)
                self.threshold = threshold or config["accuracy_threshold"]
            except ImportError:
                pass  # Presets are optional if using custom evaluator

    def evaluate_trace(
        self, context: str, answer: str, input_query: Optional[str] = None
    ) -> Dict[str, Any]:
        """Evaluate a single trace using the configured evaluator.

        Args:
            context: Source context (retrieved documents, etc.)
            answer: Model's generated answer
            input_query: Optional input query for reference

        Returns:
            Dictionary with evaluation results including:
                - matched: Boolean pass/fail
                - confidence: Overall confidence score
                - Additional metrics specific to the evaluator used
                - preset: Preset used for evaluation (if applicable)
        """
        # Use pluggable accuracy evaluator
        result = self.accuracy_evaluator.evaluate(
            context=context, answer=answer, threshold=self.threshold
        )

        # Add common fields
        result["preset"] = self.preset
        result["input"] = input_query

        return result

    def evaluate_log_file(self, log_path: str) -> Dict[str, Any]:
        """Batch evaluate all traces in a log file.

        Args:
            log_path: Path to JSONL trace log file

        Returns:
            Dictionary with aggregate results:
                - total_traces: Total number of traces evaluated
                - passed: Number of traces that passed
                - failed: Number of traces that failed
                - pass_rate: Percentage of traces that passed
                - results: List of individual evaluation results
        """
        log_file = Path(log_path)
        if not log_file.exists():
            raise FileNotFoundError(f"Log file not found: {log_path}")

        results = []
        traces_evaluated = 0
        traces_skipped = 0

        with open(log_file) as f:
            for line_num, line in enumerate(f, 1):
                try:
                    trace = json.loads(line)
                except json.JSONDecodeError as e:
                    print(f"Warning: Skipping invalid JSON on line {line_num}: {e}")
                    traces_skipped += 1
                    continue

                # Only evaluate traces with context and answer
                if trace.get("context") and trace.get("answer"):
                    eval_result = self.evaluate_trace(
                        context=trace["context"],
                        answer=trace["answer"],
                        input_query=trace.get("input"),
                    )

                    # Add trace metadata
                    eval_result.update(
                        {
                            "timestamp": trace.get("timestamp"),
                            "function": trace.get("function"),
                            "duration_ms": trace.get("duration_ms"),
                        }
                    )

                    results.append(eval_result)
                    traces_evaluated += 1
                else:
                    traces_skipped += 1

        # Aggregate statistics
        total = len(results)
        passed = sum(1 for r in results if r["matched"])
        failed = total - passed

        return {
            "total_traces": total,
            "passed": passed,
            "failed": failed,
            "pass_rate": passed / total if total > 0 else 0.0,
            "traces_skipped": traces_skipped,
            "preset": self.preset,
            "threshold": self.threshold,
            "results": results,
        }

    def evaluate_traces(self, traces: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Evaluate a list of trace dictionaries in memory.

        Args:
            traces: List of trace dictionaries with 'context' and 'answer' fields

        Returns:
            Dictionary with aggregate results (same format as evaluate_log_file)
        """
        results = []
        traces_skipped = 0

        for trace in traces:
            if trace.get("context") and trace.get("answer"):
                eval_result = self.evaluate_trace(
                    context=trace["context"], answer=trace["answer"], input_query=trace.get("input")
                )

                # Add trace metadata
                eval_result.update(
                    {
                        "timestamp": trace.get("timestamp"),
                        "function": trace.get("function"),
                        "duration_ms": trace.get("duration_ms"),
                    }
                )

                results.append(eval_result)
            else:
                traces_skipped += 1

        # Aggregate statistics
        total = len(results)
        passed = sum(1 for r in results if r["matched"])
        failed = total - passed

        return {
            "total_traces": total,
            "passed": passed,
            "failed": failed,
            "pass_rate": passed / total if total > 0 else 0.0,
            "traces_skipped": traces_skipped,
            "preset": self.preset,
            "threshold": self.threshold,
            "results": results,
        }
