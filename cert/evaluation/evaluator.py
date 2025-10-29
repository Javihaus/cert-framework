"""
Offline evaluator for batch processing trace logs.

Separates evaluation from runtime monitoring for better performance.
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional, List

from cert.core.tracer import CertTracer


class Evaluator:
    """Offline evaluation layer - requires [evaluation] extras."""

    def __init__(
        self,
        preset: str = "general",
        threshold: float = 0.7,
        tracer: Optional[CertTracer] = None
    ):
        """Initialize evaluator with preset configuration.

        Args:
            preset: Industry preset (general, financial, healthcare, legal)
            threshold: Confidence threshold for pass/fail
            tracer: Optional tracer for logging evaluation results

        Requires:
            pip install cert-framework[evaluation]
        """
        # Import measurement dependencies (only when evaluator is created)
        try:
            from cert.utils.presets import get_preset
            from cert.measure import measure
        except ImportError as e:
            raise ImportError(
                "Evaluator requires: pip install cert-framework[evaluation]\n"
                f"Original error: {e}"
            )

        # Load preset configuration
        config = get_preset(preset)
        self.threshold = threshold or config["accuracy_threshold"]
        self.preset = preset
        self.tracer = tracer or CertTracer()
        self._measure = measure

    def evaluate_trace(
        self,
        context: str,
        answer: str,
        input_query: Optional[str] = None
    ) -> Dict[str, Any]:
        """Evaluate a single trace.

        Args:
            context: Source context (retrieved documents, etc.)
            answer: Model's generated answer
            input_query: Optional input query for reference

        Returns:
            Dictionary with evaluation results including:
                - matched: Boolean pass/fail
                - confidence: Overall confidence score
                - semantic_score: Semantic similarity score
                - nli_score: NLI entailment score
                - grounding_score: Term grounding score
                - preset: Preset used for evaluation
        """
        # Use measure function for evaluation
        result = self._measure(
            text1=answer,
            text2=context,
            threshold=self.threshold
        )

        return {
            "matched": result.matched,
            "confidence": result.confidence,
            "semantic_score": result.semantic_score,
            "nli_score": result.nli_score,
            "grounding_score": result.grounding_score,
            "preset": self.preset,
            "input": input_query,
        }

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
                        input_query=trace.get("input")
                    )

                    # Add trace metadata
                    eval_result.update({
                        "timestamp": trace.get("timestamp"),
                        "function": trace.get("function"),
                        "duration_ms": trace.get("duration_ms"),
                    })

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
                    context=trace["context"],
                    answer=trace["answer"],
                    input_query=trace.get("input")
                )

                # Add trace metadata
                eval_result.update({
                    "timestamp": trace.get("timestamp"),
                    "function": trace.get("function"),
                    "duration_ms": trace.get("duration_ms"),
                })

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
