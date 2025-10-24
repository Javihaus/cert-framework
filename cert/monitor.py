"""User-facing decorator for monitoring LLM systems.

Primary use case: RAG hallucination detection for EU AI Act Article 15 compliance.
"""

import functools
import inspect
import logging
import time
from datetime import datetime
from typing import Any, Callable, Dict, Optional, Union

from cert.audit import AuditLogger
from cert.core.embeddings import get_embedding_engine
from cert.core.grounding import compute_grounding_score, get_ungrounded_terms
from cert.core.nli import get_nli_engine
from cert.presets import Preset, get_preset

logger = logging.getLogger(__name__)


class MonitorConfig:
    """Internal configuration for monitor decorator."""

    def __init__(
        self,
        preset: Optional[Union[str, Preset]] = None,
        accuracy_threshold: float = 0.90,
        hallucination_tolerance: float = 0.05,
        audit_log: str = "cert_audit.jsonl",
        alert_on_hallucination: bool = False,
        explain: bool = False,
    ):
        # Load preset if provided
        if preset:
            preset_config = get_preset(preset)
            self.accuracy_threshold = preset_config["accuracy_threshold"]
            self.hallucination_tolerance = preset_config["hallucination_tolerance"]
            self.audit_retention_months = preset_config["audit_retention_months"]
        else:
            self.accuracy_threshold = accuracy_threshold
            self.hallucination_tolerance = hallucination_tolerance
            self.audit_retention_months = 6

        self.audit_log = audit_log
        self.alert_on_hallucination = alert_on_hallucination
        self.explain = explain

        # Initialize audit logger
        self.audit_logger = AuditLogger(self.audit_log)

        # Initialize models (singleton pattern)
        self.embedding_engine = get_embedding_engine()
        self.nli_engine = get_nli_engine()

        # Statistics tracking
        self.total_calls = 0
        self.total_hallucinations = 0
        self.total_compliant = 0


def monitor(
    _func: Optional[Callable] = None,
    *,
    preset: Optional[Union[str, Preset]] = None,
    accuracy_threshold: float = 0.90,
    hallucination_tolerance: float = 0.05,
    audit_log: str = "cert_audit.jsonl",
    alert_on_hallucination: bool = False,
    explain: bool = False,
) -> Callable:
    """Monitor LLM function for accuracy and hallucinations.

    Primary use case: RAG hallucination detection for EU AI Act Article 15.

    Args:
        preset: Industry preset ("financial", "healthcare", "general")
        accuracy_threshold: Minimum accuracy for compliance (default: 0.90)
        hallucination_tolerance: Maximum hallucination rate (default: 0.05)
        audit_log: Path to audit log file (default: "cert_audit.jsonl")
        alert_on_hallucination: Alert when hallucination detected (default: False)
        explain: Show explanations for compliance metrics (default: False)

    Returns:
        Decorated function with automatic monitoring

    Examples:
        # Zero config (smart defaults)
        @cert.monitor
        def my_rag(query):
            context = retrieve(query)
            answer = llm(context, query)
            return answer

        # With preset
        @cert.monitor(preset="financial")
        def my_rag(query):
            return rag_pipeline(query)

        # Custom config
        @cert.monitor(
            accuracy_threshold=0.95,
            alert_on_hallucination=True
        )
        def my_rag(query):
            return rag_pipeline(query)
    """

    def decorator(func: Callable) -> Callable:
        # Create config for this function
        config = MonitorConfig(
            preset=preset,
            accuracy_threshold=accuracy_threshold,
            hallucination_tolerance=hallucination_tolerance,
            audit_log=audit_log,
            alert_on_hallucination=alert_on_hallucination,
            explain=explain,
        )

        # Print startup message
        _print_startup_message(func.__name__, config)

        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            start_time = time.time()
            timestamp = datetime.now().isoformat()

            # Detect function type from signature
            func_type = _detect_function_type(func, args, kwargs)

            # Call original function
            try:
                result = func(*args, **kwargs)
            except Exception as e:
                # Log error and re-raise
                config.audit_logger.log_error(
                    function_name=func.__name__,
                    error=str(e),
                    timestamp=timestamp,
                )
                raise

            # Extract context and answer based on function type
            context, answer = _extract_context_answer(func_type, args, kwargs, result)

            if context is None or answer is None:
                # Can't monitor without context and answer
                logger.warning(
                    f"Cannot monitor {func.__name__}: unable to extract context/answer"
                )
                return result

            # Measure accuracy
            accuracy_result = _measure_accuracy(
                context=context,
                answer=answer,
                config=config,
            )

            # Update statistics
            config.total_calls += 1
            if accuracy_result["is_hallucination"]:
                config.total_hallucinations += 1
            if accuracy_result["is_compliant"]:
                config.total_compliant += 1

            # Log to audit trail
            config.audit_logger.log_request(
                function_name=func.__name__,
                context=context,
                answer=answer,
                accuracy_score=accuracy_result["accuracy_score"],
                hallucination_detected=accuracy_result["is_hallucination"],
                is_compliant=accuracy_result["is_compliant"],
                metrics=accuracy_result["metrics"],
                timestamp=timestamp,
                duration_ms=(time.time() - start_time) * 1000,
            )

            # Alert if hallucination detected
            if config.alert_on_hallucination and accuracy_result["is_hallucination"]:
                _alert_hallucination(func.__name__, accuracy_result, config)

            # Show periodic status updates
            if config.total_calls % 100 == 0:
                _show_status_update(func.__name__, config)

            return result

        # Store config on wrapper for later access
        wrapper._cert_config = config  # type: ignore

        return wrapper

    # Support both @monitor and @monitor(...)
    if _func is None:
        # Called with arguments: @monitor(preset="financial")
        return decorator
    else:
        # Called without arguments: @monitor
        return decorator(_func)


def _detect_function_type(func: Callable, args: tuple, kwargs: dict) -> str:
    """Detect if function is RAG, single-model, or coordination.

    Returns:
        "rag", "single", or "coordination"
    """
    sig = inspect.signature(func)
    param_names = [p.name for p in sig.parameters.values()]

    # RAG: has 'query' or 'question' parameter, returns answer
    if any(name in param_names for name in ["query", "question"]):
        return "rag"

    # Single: has 'prompt' parameter
    if "prompt" in param_names:
        return "single"

    # Coordination: has 'agents' or 'task' parameter
    if any(name in param_names for name in ["agents", "task"]):
        return "coordination"

    # Default to RAG (most common)
    return "rag"


def _extract_context_answer(
    func_type: str, args: tuple, kwargs: dict, result: Any
) -> tuple[Optional[str], Optional[str]]:
    """Extract context and answer from function call.

    Returns:
        (context, answer) tuple
    """
    if func_type == "rag":
        # RAG: context might be in result, answer is result
        # Try to extract context from result if it's a dict
        if isinstance(result, dict):
            context = result.get("context", result.get("source", None))
            answer = result.get("answer", result.get("response", None))
        elif isinstance(result, str):
            # Result is just the answer
            # Try to get context from kwargs
            context = kwargs.get("context", None)
            answer = result
        else:
            context = None
            answer = str(result)

        return context, answer

    elif func_type == "single":
        # Single model: expected vs actual
        expected = kwargs.get("expected", None)
        actual = result
        return expected, actual

    else:
        # Coordination or unknown
        return None, None


def _measure_accuracy(
    context: str, answer: str, config: MonitorConfig
) -> Dict[str, Any]:
    """Measure accuracy using semantic, NLI, and grounding analysis."""

    # Semantic similarity
    semantic_score = config.embedding_engine.compute_similarity(context, answer)

    # NLI contradiction detection
    nli_result = config.nli_engine.check_entailment(context, answer)
    nli_score = nli_result.entailment_score
    is_contradiction = nli_result.label == "contradiction"

    # Grounding analysis
    grounding_score = compute_grounding_score(context, answer)
    ungrounded_terms = get_ungrounded_terms(context, answer)

    # Combined accuracy score (weighted average)
    accuracy_score = 0.3 * semantic_score + 0.5 * nli_score + 0.2 * grounding_score

    # Hallucination detection
    is_hallucination = (
        is_contradiction
        or nli_score < 0.3
        or grounding_score < 0.5
        or len(ungrounded_terms) > 5
    )

    # Compliance check
    is_compliant = accuracy_score >= config.accuracy_threshold and not is_hallucination

    return {
        "accuracy_score": accuracy_score,
        "is_hallucination": is_hallucination,
        "is_compliant": is_compliant,
        "metrics": {
            "semantic_score": semantic_score,
            "nli_score": nli_score,
            "grounding_score": grounding_score,
            "is_contradiction": is_contradiction,
            "ungrounded_terms_count": len(ungrounded_terms),
        },
    }


def _print_startup_message(function_name: str, config: MonitorConfig):
    """Print startup message when decorator is applied."""
    print("\n" + "=" * 60)
    print("✓ CERT Framework Monitoring Enabled")
    print("=" * 60)
    print(f"Function: {function_name}")
    print(f"Accuracy threshold: {config.accuracy_threshold:.0%}")
    print(f"Hallucination tolerance: {config.hallucination_tolerance:.0%}")
    print(f"Audit log: {config.audit_log}")
    print("EU AI Act Article 15: Ready for compliance")
    print("=" * 60 + "\n")

    if config.explain:
        _print_explanation()


def _print_explanation():
    """Print explanation of what CERT monitors."""
    print("\n📖 What CERT monitors:")
    print("  • Semantic accuracy - Does answer match context meaning?")
    print("  • NLI contradiction - Does answer contradict context?")
    print("  • Grounding - Is answer grounded in provided context?")
    print("  • Hallucination rate - How often does model hallucinate?")
    print("\n📋 EU AI Act Article 15 Compliance:")
    print("  • Article 15.1 - Appropriate levels of accuracy")
    print("  • Article 15.4 - Resilience regarding errors")
    print("  • Article 19 - Automatic logging for audit trail")
    print()


def _alert_hallucination(
    function_name: str, accuracy_result: Dict[str, Any], config: MonitorConfig
):
    """Alert when hallucination is detected."""
    print("\n" + "!" * 60)
    print("⚠️  HALLUCINATION DETECTED")
    print("!" * 60)
    print(f"Function: {function_name}")
    print(f"Accuracy score: {accuracy_result['accuracy_score']:.1%}")
    print(
        f"NLI score: {accuracy_result['metrics']['nli_score']:.3f} "
        f"({'CONTRADICTION' if accuracy_result['metrics']['is_contradiction'] else 'OK'})"
    )
    print(f"Grounding score: {accuracy_result['metrics']['grounding_score']:.1%}")
    print(f"Ungrounded terms: {accuracy_result['metrics']['ungrounded_terms_count']}")
    print("!" * 60 + "\n")


def _show_status_update(function_name: str, config: MonitorConfig):
    """Show periodic status update."""
    hallucination_rate = (
        config.total_hallucinations / config.total_calls
        if config.total_calls > 0
        else 0.0
    )
    compliance_rate = (
        config.total_compliant / config.total_calls if config.total_calls > 0 else 0.0
    )

    status = (
        "✓ COMPLIANT"
        if hallucination_rate <= config.hallucination_tolerance
        else "✗ NON-COMPLIANT"
    )

    print("\n" + "-" * 60)
    print(f"📊 Status Update - {function_name}")
    print("-" * 60)
    print(f"Total requests: {config.total_calls}")
    print(f"Hallucination rate: {hallucination_rate:.1%}")
    print(f"Compliance rate: {compliance_rate:.1%}")
    print(f"Status: {status}")
    print("-" * 60 + "\n")
