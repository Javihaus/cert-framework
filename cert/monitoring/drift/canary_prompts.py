"""
Canary Prompt Monitoring for LLM Consistency

This module implements canary prompt monitoring - a technique that sends
fixed, known prompts to LLMs at regular intervals to detect changes in
model behavior, performance, or consistency over time.

Key Features:
- Predefined canary prompts for different capabilities (reasoning, factuality, etc.)
- Response consistency tracking over time
- Statistical deviation detection
- Configurable check intervals and thresholds
"""

import hashlib
import json
import statistics
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable


class CanaryType(Enum):
    """Types of canary prompts for different capability testing."""

    REASONING = "reasoning"
    FACTUALITY = "factuality"
    CONSISTENCY = "consistency"
    SUMMARIZATION = "summarization"
    EXTRACTION = "extraction"
    SAFETY = "safety"
    INSTRUCTION_FOLLOWING = "instruction_following"


@dataclass
class CanaryPrompt:
    """Definition of a canary prompt with expected behavior."""

    prompt: str
    canary_type: CanaryType
    expected_response: str | None = None  # Exact or pattern match
    expected_keywords: list[str] = field(default_factory=list)
    forbidden_keywords: list[str] = field(default_factory=list)
    max_response_length: int | None = None
    min_response_length: int | None = None
    description: str = ""

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "prompt": self.prompt,
            "canary_type": self.canary_type.value,
            "expected_response": self.expected_response,
            "expected_keywords": self.expected_keywords,
            "forbidden_keywords": self.forbidden_keywords,
            "max_response_length": self.max_response_length,
            "min_response_length": self.min_response_length,
            "description": self.description,
        }


@dataclass
class CanaryResult:
    """Result of a canary prompt check."""

    canary_id: str
    prompt: str
    response: str
    passed: bool
    consistency_score: float  # 0.0 = inconsistent, 1.0 = perfectly consistent
    deviation_from_baseline: float
    latency_ms: float
    timestamp: datetime = field(default_factory=datetime.utcnow)
    issues: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "canary_id": self.canary_id,
            "prompt": self.prompt,
            "response": self.response,
            "passed": self.passed,
            "consistency_score": self.consistency_score,
            "deviation_from_baseline": self.deviation_from_baseline,
            "latency_ms": self.latency_ms,
            "timestamp": self.timestamp.isoformat(),
            "issues": self.issues,
        }


@dataclass
class CanaryHistory:
    """History of canary results for trend analysis."""

    results: list[CanaryResult] = field(default_factory=list)
    max_history: int = 1000

    def add(self, result: CanaryResult) -> None:
        """Add a result to history."""
        self.results.append(result)
        if len(self.results) > self.max_history:
            self.results.pop(0)

    def get_pass_rate(self, window_hours: int = 24) -> float:
        """Get pass rate within time window."""
        cutoff = datetime.utcnow() - timedelta(hours=window_hours)
        recent = [r for r in self.results if r.timestamp >= cutoff]
        if not recent:
            return 1.0
        return sum(1 for r in recent if r.passed) / len(recent)

    def get_average_consistency(self, window_hours: int = 24) -> float:
        """Get average consistency score within time window."""
        cutoff = datetime.utcnow() - timedelta(hours=window_hours)
        recent = [r for r in self.results if r.timestamp >= cutoff]
        if not recent:
            return 1.0
        return statistics.mean(r.consistency_score for r in recent)

    def get_latency_stats(self, window_hours: int = 24) -> dict[str, float]:
        """Get latency statistics within time window."""
        cutoff = datetime.utcnow() - timedelta(hours=window_hours)
        latencies = [r.latency_ms for r in self.results if r.timestamp >= cutoff]
        if not latencies:
            return {"mean": 0, "median": 0, "std": 0, "min": 0, "max": 0}

        return {
            "mean": statistics.mean(latencies),
            "median": statistics.median(latencies),
            "std": statistics.stdev(latencies) if len(latencies) > 1 else 0,
            "min": min(latencies),
            "max": max(latencies),
        }


# Default canary prompts for common capability testing
DEFAULT_CANARY_PROMPTS = [
    CanaryPrompt(
        prompt="What is 2 + 2?",
        canary_type=CanaryType.REASONING,
        expected_response="4",
        expected_keywords=["4", "four"],
        description="Basic arithmetic reasoning",
    ),
    CanaryPrompt(
        prompt="Is the following statement true or false: The Earth orbits the Sun.",
        canary_type=CanaryType.FACTUALITY,
        expected_keywords=["true", "correct", "yes"],
        forbidden_keywords=["false", "incorrect", "no"],
        description="Basic factual knowledge",
    ),
    CanaryPrompt(
        prompt="Summarize in exactly one sentence: The quick brown fox jumps over the lazy dog.",
        canary_type=CanaryType.SUMMARIZATION,
        max_response_length=200,
        description="Summarization capability",
    ),
    CanaryPrompt(
        prompt="Extract the color from this sentence: The car was bright red.",
        canary_type=CanaryType.EXTRACTION,
        expected_keywords=["red"],
        description="Information extraction",
    ),
    CanaryPrompt(
        prompt="Respond with only the word 'hello' and nothing else.",
        canary_type=CanaryType.INSTRUCTION_FOLLOWING,
        expected_response="hello",
        max_response_length=20,
        description="Instruction following",
    ),
]


class CanaryPromptMonitor:
    """
    Monitors LLM consistency using canary prompts.

    Canary prompts are fixed, known inputs sent to the model at regular intervals
    to detect changes in behavior, quality, or performance. By comparing responses
    over time, this monitor can detect:
    - Model degradation or drift
    - Performance regressions
    - Inconsistent behavior
    - Safety filter changes

    Example:
        monitor = CanaryPromptMonitor()

        # Add canary prompts
        monitor.add_canary(CanaryPrompt(
            prompt="What is the capital of France?",
            canary_type=CanaryType.FACTUALITY,
            expected_keywords=["Paris"]
        ))

        # Run checks with your LLM function
        def my_llm(prompt):
            # Your LLM call here
            return response

        results = monitor.run_all_checks(my_llm)
        for result in results:
            print(f"{result.canary_id}: {'PASS' if result.passed else 'FAIL'}")
    """

    def __init__(
        self,
        consistency_threshold: float = 0.8,
        latency_threshold_ms: float = 5000.0,
        use_default_canaries: bool = True,
        on_failure_callback: Callable[[CanaryResult], None] | None = None,
    ):
        """
        Initialize the canary prompt monitor.

        Args:
            consistency_threshold: Minimum consistency score to pass (0.0-1.0)
            latency_threshold_ms: Maximum acceptable latency in milliseconds
            use_default_canaries: Whether to include default canary prompts
            on_failure_callback: Callback function when a canary check fails
        """
        self.consistency_threshold = consistency_threshold
        self.latency_threshold_ms = latency_threshold_ms
        self.on_failure_callback = on_failure_callback

        self._canaries: dict[str, CanaryPrompt] = {}
        self._baselines: dict[str, list[str]] = {}  # Baseline responses per canary
        self._history: dict[str, CanaryHistory] = {}  # History per canary
        self._embedding_cache: dict[str, list[float]] = {}

        if use_default_canaries:
            for canary in DEFAULT_CANARY_PROMPTS:
                self.add_canary(canary)

    def _generate_canary_id(self, prompt: str) -> str:
        """Generate a unique ID for a canary prompt."""
        return hashlib.md5(prompt.encode()).hexdigest()[:12]

    def add_canary(self, canary: CanaryPrompt) -> str:
        """
        Add a canary prompt to the monitor.

        Args:
            canary: CanaryPrompt definition

        Returns:
            Generated canary ID
        """
        canary_id = self._generate_canary_id(canary.prompt)
        self._canaries[canary_id] = canary
        self._history[canary_id] = CanaryHistory()
        return canary_id

    def remove_canary(self, canary_id: str) -> bool:
        """Remove a canary prompt by ID."""
        if canary_id in self._canaries:
            del self._canaries[canary_id]
            if canary_id in self._history:
                del self._history[canary_id]
            if canary_id in self._baselines:
                del self._baselines[canary_id]
            return True
        return False

    def add_baseline_response(self, canary_id: str, response: str) -> bool:
        """
        Add a baseline response for a canary prompt.

        Baseline responses are used to measure consistency over time.

        Args:
            canary_id: The canary prompt ID
            response: A known good response

        Returns:
            True if successfully added, False if canary not found
        """
        if canary_id not in self._canaries:
            return False

        if canary_id not in self._baselines:
            self._baselines[canary_id] = []

        self._baselines[canary_id].append(response)
        return True

    def _compute_consistency_score(
        self,
        response: str,
        canary_id: str,
        canary: CanaryPrompt,
    ) -> tuple[float, list[str]]:
        """
        Compute consistency score for a response.

        Returns:
            Tuple of (consistency_score, list of issues)
        """
        issues = []
        score = 1.0

        # Check expected response
        if canary.expected_response:
            response_lower = response.lower().strip()
            expected_lower = canary.expected_response.lower().strip()
            if expected_lower not in response_lower:
                issues.append(f"Expected '{canary.expected_response}' not in response")
                score -= 0.3

        # Check expected keywords
        response_lower = response.lower()
        for keyword in canary.expected_keywords:
            if keyword.lower() not in response_lower:
                issues.append(f"Missing expected keyword: {keyword}")
                score -= 0.2

        # Check forbidden keywords
        for keyword in canary.forbidden_keywords:
            if keyword.lower() in response_lower:
                issues.append(f"Contains forbidden keyword: {keyword}")
                score -= 0.3

        # Check response length
        if canary.max_response_length and len(response) > canary.max_response_length:
            issues.append(f"Response too long: {len(response)} > {canary.max_response_length}")
            score -= 0.2

        if canary.min_response_length and len(response) < canary.min_response_length:
            issues.append(f"Response too short: {len(response)} < {canary.min_response_length}")
            score -= 0.2

        # Compare with baseline responses if available
        if canary_id in self._baselines and self._baselines[canary_id]:
            baseline_similarity = self._compute_baseline_similarity(
                response, self._baselines[canary_id]
            )
            if baseline_similarity < 0.5:
                issues.append(f"Low similarity to baseline: {baseline_similarity:.2f}")
                score -= 0.2 * (1 - baseline_similarity)

        return max(0.0, min(1.0, score)), issues

    def _compute_baseline_similarity(
        self,
        response: str,
        baselines: list[str],
    ) -> float:
        """Compute similarity of response to baseline responses."""
        # Simple word overlap similarity
        response_words = set(response.lower().split())
        max_similarity = 0.0

        for baseline in baselines:
            baseline_words = set(baseline.lower().split())
            if response_words or baseline_words:
                intersection = response_words & baseline_words
                union = response_words | baseline_words
                similarity = len(intersection) / len(union) if union else 0
                max_similarity = max(max_similarity, similarity)

        return max_similarity

    def _compute_deviation(self, canary_id: str, current_score: float) -> float:
        """Compute deviation from historical average."""
        if canary_id not in self._history:
            return 0.0

        history = self._history[canary_id]
        if len(history.results) < 3:
            return 0.0

        historical_scores = [r.consistency_score for r in history.results[-10:]]
        if not historical_scores:
            return 0.0

        avg = statistics.mean(historical_scores)
        return abs(current_score - avg)

    def check_canary(
        self,
        canary_id: str,
        llm_function: Callable[[str], str],
    ) -> CanaryResult | None:
        """
        Run a single canary check.

        Args:
            canary_id: ID of the canary to check
            llm_function: Function that takes a prompt and returns LLM response

        Returns:
            CanaryResult or None if canary not found
        """
        if canary_id not in self._canaries:
            return None

        canary = self._canaries[canary_id]

        # Time the LLM call
        start_time = datetime.utcnow()
        try:
            response = llm_function(canary.prompt)
        except Exception as e:
            return CanaryResult(
                canary_id=canary_id,
                prompt=canary.prompt,
                response="",
                passed=False,
                consistency_score=0.0,
                deviation_from_baseline=1.0,
                latency_ms=0.0,
                issues=[f"LLM call failed: {str(e)}"],
            )

        end_time = datetime.utcnow()
        latency_ms = (end_time - start_time).total_seconds() * 1000

        # Compute consistency score
        consistency_score, issues = self._compute_consistency_score(response, canary_id, canary)

        # Check latency
        if latency_ms > self.latency_threshold_ms:
            issues.append(
                f"Latency exceeded threshold: {latency_ms:.0f}ms > {self.latency_threshold_ms:.0f}ms"
            )

        # Compute deviation
        deviation = self._compute_deviation(canary_id, consistency_score)

        # Determine pass/fail
        passed = (
            consistency_score >= self.consistency_threshold
            and latency_ms <= self.latency_threshold_ms
        )

        result = CanaryResult(
            canary_id=canary_id,
            prompt=canary.prompt,
            response=response,
            passed=passed,
            consistency_score=consistency_score,
            deviation_from_baseline=deviation,
            latency_ms=latency_ms,
            issues=issues,
        )

        # Store in history
        self._history[canary_id].add(result)

        # Call failure callback if needed
        if not passed and self.on_failure_callback:
            self.on_failure_callback(result)

        return result

    def run_all_checks(
        self,
        llm_function: Callable[[str], str],
        canary_types: list[CanaryType] | None = None,
    ) -> list[CanaryResult]:
        """
        Run all canary checks.

        Args:
            llm_function: Function that takes a prompt and returns LLM response
            canary_types: Optional filter by canary types

        Returns:
            List of CanaryResult objects
        """
        results = []

        for canary_id, canary in self._canaries.items():
            if canary_types and canary.canary_type not in canary_types:
                continue

            result = self.check_canary(canary_id, llm_function)
            if result:
                results.append(result)

        return results

    def get_summary(self, window_hours: int = 24) -> dict[str, Any]:
        """
        Get a summary of canary monitoring status.

        Args:
            window_hours: Time window for statistics

        Returns:
            Summary dictionary with pass rates and statistics
        """
        summary = {
            "total_canaries": len(self._canaries),
            "window_hours": window_hours,
            "canaries": {},
            "overall_pass_rate": 0.0,
            "overall_consistency": 0.0,
        }

        pass_rates = []
        consistencies = []

        for canary_id in self._canaries:
            if canary_id in self._history:
                history = self._history[canary_id]
                pass_rate = history.get_pass_rate(window_hours)
                consistency = history.get_average_consistency(window_hours)
                latency_stats = history.get_latency_stats(window_hours)

                pass_rates.append(pass_rate)
                consistencies.append(consistency)

                summary["canaries"][canary_id] = {
                    "type": self._canaries[canary_id].canary_type.value,
                    "pass_rate": pass_rate,
                    "consistency": consistency,
                    "latency": latency_stats,
                    "total_checks": len(history.results),
                }

        if pass_rates:
            summary["overall_pass_rate"] = statistics.mean(pass_rates)
        if consistencies:
            summary["overall_consistency"] = statistics.mean(consistencies)

        return summary

    def export_config(self) -> dict[str, Any]:
        """Export monitor configuration."""
        return {
            "consistency_threshold": self.consistency_threshold,
            "latency_threshold_ms": self.latency_threshold_ms,
            "canaries": {cid: canary.to_dict() for cid, canary in self._canaries.items()},
            "baselines": self._baselines,
        }

    def save_config(self, filepath: str) -> bool:
        """Save configuration to JSON file."""
        try:
            with open(filepath, "w") as f:
                json.dump(self.export_config(), f, indent=2)
            return True
        except Exception:
            return False

    def load_config(self, filepath: str) -> bool:
        """Load configuration from JSON file."""
        try:
            with open(filepath) as f:
                config = json.load(f)

            self.consistency_threshold = config.get(
                "consistency_threshold", self.consistency_threshold
            )
            self.latency_threshold_ms = config.get(
                "latency_threshold_ms", self.latency_threshold_ms
            )
            self._baselines = config.get("baselines", {})

            # Load canaries
            for cid, canary_data in config.get("canaries", {}).items():
                canary = CanaryPrompt(
                    prompt=canary_data["prompt"],
                    canary_type=CanaryType(canary_data["canary_type"]),
                    expected_response=canary_data.get("expected_response"),
                    expected_keywords=canary_data.get("expected_keywords", []),
                    forbidden_keywords=canary_data.get("forbidden_keywords", []),
                    max_response_length=canary_data.get("max_response_length"),
                    min_response_length=canary_data.get("min_response_length"),
                    description=canary_data.get("description", ""),
                )
                self._canaries[cid] = canary
                if cid not in self._history:
                    self._history[cid] = CanaryHistory()

            return True
        except Exception:
            return False
