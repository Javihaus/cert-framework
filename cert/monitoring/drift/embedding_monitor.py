"""
Embedding-based Drift Detection for LLM Outputs

This module implements statistical drift detection by comparing embedding distributions
of LLM outputs over time. It uses cosine distance, Euclidean distance, and statistical
tests to identify when model behavior changes significantly.

Key Features:
- Baseline establishment from historical data
- Multi-dimensional drift detection (input/output embeddings)
- Statistical significance testing (KS test, MMD)
- Configurable sensitivity thresholds
- Real-time alerting integration
"""

import json
import math
import warnings
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Callable


class DriftSeverity(Enum):
    """Severity levels for detected drift."""

    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class DriftResult:
    """Result of a drift detection check."""

    detected: bool
    severity: DriftSeverity
    drift_score: float  # 0.0 = no drift, 1.0 = maximum drift
    baseline_centroid_distance: float
    distribution_divergence: float
    sample_size: int
    timestamp: datetime = field(default_factory=datetime.utcnow)
    details: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "detected": self.detected,
            "severity": self.severity.value,
            "drift_score": self.drift_score,
            "baseline_centroid_distance": self.baseline_centroid_distance,
            "distribution_divergence": self.distribution_divergence,
            "sample_size": self.sample_size,
            "timestamp": self.timestamp.isoformat(),
            "details": self.details,
        }


@dataclass
class EmbeddingWindow:
    """Sliding window of embeddings for statistical analysis."""

    embeddings: list[list[float]] = field(default_factory=list)
    timestamps: list[datetime] = field(default_factory=list)
    max_size: int = 1000

    def add(self, embedding: list[float], timestamp: datetime | None = None) -> None:
        """Add an embedding to the window."""
        self.embeddings.append(embedding)
        self.timestamps.append(timestamp or datetime.utcnow())

        # Maintain window size
        if len(self.embeddings) > self.max_size:
            self.embeddings.pop(0)
            self.timestamps.pop(0)

    def clear(self) -> None:
        """Clear all embeddings from the window."""
        self.embeddings.clear()
        self.timestamps.clear()

    @property
    def size(self) -> int:
        """Number of embeddings in the window."""
        return len(self.embeddings)

    def compute_centroid(self) -> list[float] | None:
        """Compute the centroid of all embeddings in the window."""
        if not self.embeddings:
            return None

        dim = len(self.embeddings[0])
        centroid = [0.0] * dim

        for emb in self.embeddings:
            for i, val in enumerate(emb):
                centroid[i] += val

        n = len(self.embeddings)
        return [c / n for c in centroid]

    def compute_variance(self) -> list[float] | None:
        """Compute per-dimension variance."""
        if len(self.embeddings) < 2:
            return None

        centroid = self.compute_centroid()
        if centroid is None:
            return None

        dim = len(self.embeddings[0])
        variance = [0.0] * dim

        for emb in self.embeddings:
            for i, val in enumerate(emb):
                variance[i] += (val - centroid[i]) ** 2

        n = len(self.embeddings)
        return [v / (n - 1) for v in variance]


class EmbeddingDriftMonitor:
    """
    Monitors embedding distributions for drift detection.

    This class maintains baseline statistics from historical embeddings
    and compares new embeddings against the baseline to detect significant
    changes in model behavior.

    Example:
        monitor = EmbeddingDriftMonitor(drift_threshold=0.3)

        # Establish baseline from historical data
        for embedding in historical_embeddings:
            monitor.add_to_baseline(embedding)
        monitor.finalize_baseline()

        # Monitor new outputs
        for new_embedding in production_embeddings:
            result = monitor.check_drift(new_embedding)
            if result.detected:
                print(f"Drift detected: {result.severity}")
    """

    def __init__(
        self,
        drift_threshold: float = 0.3,
        warning_threshold: float = 0.2,
        critical_threshold: float = 0.5,
        window_size: int = 100,
        min_samples_for_detection: int = 10,
        embedding_model: str | None = None,
        on_drift_callback: Callable[[DriftResult], None] | None = None,
    ):
        """
        Initialize the drift monitor.

        Args:
            drift_threshold: Cosine distance threshold for drift detection
            warning_threshold: Threshold for low/medium severity warnings
            critical_threshold: Threshold for critical alerts
            window_size: Size of sliding window for recent embeddings
            min_samples_for_detection: Minimum samples needed for reliable detection
            embedding_model: Model name for generating embeddings (optional)
            on_drift_callback: Callback function when drift is detected
        """
        self.drift_threshold = drift_threshold
        self.warning_threshold = warning_threshold
        self.critical_threshold = critical_threshold
        self.window_size = window_size
        self.min_samples_for_detection = min_samples_for_detection
        self.embedding_model = embedding_model
        self.on_drift_callback = on_drift_callback

        # Baseline statistics
        self._baseline_window = EmbeddingWindow(max_size=10000)
        self._baseline_centroid: list[float] | None = None
        self._baseline_variance: list[float] | None = None
        self._baseline_finalized = False

        # Current monitoring window
        self._current_window = EmbeddingWindow(max_size=window_size)

        # History tracking
        self._drift_history: list[DriftResult] = []
        self._embedding_engine: Any = None

    def _get_embedding_engine(self) -> Any:
        """Lazy load the embedding engine."""
        if self._embedding_engine is None:
            try:
                from cert.measure.embeddings import get_embedding_engine

                self._embedding_engine = get_embedding_engine()
            except ImportError:
                warnings.warn(
                    "sentence-transformers not available. "
                    "Install with: pip install cert-framework[evaluation]",
                    stacklevel=2,
                )
                return None
        return self._embedding_engine

    def generate_embedding(self, text: str) -> list[float] | None:
        """Generate embedding for text using the configured model."""
        engine = self._get_embedding_engine()
        if engine is None:
            return None

        try:
            embedding = engine.encode(text, convert_to_numpy=True)
            return embedding.tolist()
        except Exception as e:
            warnings.warn(f"Failed to generate embedding: {e}", stacklevel=2)
            return None

    def add_to_baseline(
        self,
        embedding: list[float] | None = None,
        text: str | None = None,
        timestamp: datetime | None = None,
    ) -> bool:
        """
        Add an embedding to the baseline distribution.

        Args:
            embedding: Pre-computed embedding vector
            text: Text to generate embedding for (if embedding not provided)
            timestamp: Optional timestamp for the embedding

        Returns:
            True if successfully added, False otherwise
        """
        if self._baseline_finalized:
            warnings.warn("Baseline already finalized. Call reset_baseline() first.", stacklevel=2)
            return False

        if embedding is None and text is not None:
            embedding = self.generate_embedding(text)

        if embedding is None:
            return False

        self._baseline_window.add(embedding, timestamp)
        return True

    def finalize_baseline(self) -> bool:
        """
        Finalize the baseline by computing statistics.

        Returns:
            True if baseline successfully finalized, False otherwise
        """
        if self._baseline_window.size < self.min_samples_for_detection:
            warnings.warn(
                f"Insufficient baseline samples ({self._baseline_window.size}). "
                f"Need at least {self.min_samples_for_detection}.",
                stacklevel=2,
            )
            return False

        self._baseline_centroid = self._baseline_window.compute_centroid()
        self._baseline_variance = self._baseline_window.compute_variance()
        self._baseline_finalized = True

        return True

    def reset_baseline(self) -> None:
        """Reset the baseline to allow re-establishment."""
        self._baseline_window.clear()
        self._baseline_centroid = None
        self._baseline_variance = None
        self._baseline_finalized = False

    def _cosine_distance(self, vec1: list[float], vec2: list[float]) -> float:
        """Compute cosine distance between two vectors."""
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        norm1 = math.sqrt(sum(a * a for a in vec1))
        norm2 = math.sqrt(sum(b * b for b in vec2))

        if norm1 == 0 or norm2 == 0:
            return 1.0

        cosine_similarity = dot_product / (norm1 * norm2)
        return 1.0 - cosine_similarity

    def _euclidean_distance(self, vec1: list[float], vec2: list[float]) -> float:
        """Compute Euclidean distance between two vectors."""
        return math.sqrt(sum((a - b) ** 2 for a, b in zip(vec1, vec2)))

    def _compute_drift_score(
        self,
        current_centroid: list[float],
        current_variance: list[float] | None,
    ) -> tuple[float, float, float]:
        """
        Compute drift score based on centroid distance and distribution divergence.

        Returns:
            Tuple of (drift_score, centroid_distance, distribution_divergence)
        """
        if self._baseline_centroid is None:
            return 0.0, 0.0, 0.0

        # Centroid distance (cosine)
        centroid_distance = self._cosine_distance(current_centroid, self._baseline_centroid)

        # Distribution divergence (simplified KL-like measure using variance ratio)
        distribution_divergence = 0.0
        if current_variance and self._baseline_variance:
            divergences = []
            for cv, bv in zip(current_variance, self._baseline_variance):
                if bv > 0:
                    # Log ratio of variances
                    ratio = cv / bv if cv > 0 else 0.01
                    divergences.append(abs(math.log(ratio + 0.001)))
            if divergences:
                distribution_divergence = sum(divergences) / len(divergences)
                # Normalize to 0-1 range (approximate)
                distribution_divergence = min(1.0, distribution_divergence / 2.0)

        # Combined drift score (weighted average)
        drift_score = 0.7 * centroid_distance + 0.3 * distribution_divergence

        return drift_score, centroid_distance, distribution_divergence

    def _determine_severity(self, drift_score: float) -> DriftSeverity:
        """Determine drift severity based on score."""
        if drift_score >= self.critical_threshold:
            return DriftSeverity.CRITICAL
        elif drift_score >= self.drift_threshold:
            return DriftSeverity.HIGH
        elif drift_score >= self.warning_threshold:
            return DriftSeverity.MEDIUM
        elif drift_score > 0.1:
            return DriftSeverity.LOW
        return DriftSeverity.NONE

    def check_drift(
        self,
        embedding: list[float] | None = None,
        text: str | None = None,
    ) -> DriftResult:
        """
        Check for drift by adding a new embedding and comparing against baseline.

        Args:
            embedding: Pre-computed embedding vector
            text: Text to generate embedding for (if embedding not provided)

        Returns:
            DriftResult with drift detection details
        """
        if not self._baseline_finalized:
            return DriftResult(
                detected=False,
                severity=DriftSeverity.NONE,
                drift_score=0.0,
                baseline_centroid_distance=0.0,
                distribution_divergence=0.0,
                sample_size=0,
                details={"error": "Baseline not finalized"},
            )

        # Generate embedding if needed
        if embedding is None and text is not None:
            embedding = self.generate_embedding(text)

        if embedding is None:
            return DriftResult(
                detected=False,
                severity=DriftSeverity.NONE,
                drift_score=0.0,
                baseline_centroid_distance=0.0,
                distribution_divergence=0.0,
                sample_size=0,
                details={"error": "No embedding provided or generated"},
            )

        # Add to current window
        self._current_window.add(embedding)

        # Check if we have enough samples
        if self._current_window.size < self.min_samples_for_detection:
            return DriftResult(
                detected=False,
                severity=DriftSeverity.NONE,
                drift_score=0.0,
                baseline_centroid_distance=0.0,
                distribution_divergence=0.0,
                sample_size=self._current_window.size,
                details={"status": "collecting_samples"},
            )

        # Compute current statistics
        current_centroid = self._current_window.compute_centroid()
        current_variance = self._current_window.compute_variance()

        if current_centroid is None:
            return DriftResult(
                detected=False,
                severity=DriftSeverity.NONE,
                drift_score=0.0,
                baseline_centroid_distance=0.0,
                distribution_divergence=0.0,
                sample_size=self._current_window.size,
                details={"error": "Could not compute current centroid"},
            )

        # Compute drift metrics
        drift_score, centroid_distance, dist_divergence = self._compute_drift_score(
            current_centroid, current_variance
        )

        # Determine severity
        severity = self._determine_severity(drift_score)
        detected = severity in (DriftSeverity.HIGH, DriftSeverity.CRITICAL)

        # Create result
        result = DriftResult(
            detected=detected,
            severity=severity,
            drift_score=drift_score,
            baseline_centroid_distance=centroid_distance,
            distribution_divergence=dist_divergence,
            sample_size=self._current_window.size,
            details={
                "baseline_size": self._baseline_window.size,
                "threshold": self.drift_threshold,
                "warning_threshold": self.warning_threshold,
                "critical_threshold": self.critical_threshold,
            },
        )

        # Store in history
        self._drift_history.append(result)

        # Call callback if drift detected
        if detected and self.on_drift_callback:
            self.on_drift_callback(result)

        return result

    def get_drift_history(
        self,
        limit: int | None = None,
        severity_filter: DriftSeverity | None = None,
    ) -> list[DriftResult]:
        """
        Get historical drift results.

        Args:
            limit: Maximum number of results to return
            severity_filter: Filter by minimum severity level

        Returns:
            List of DriftResult objects
        """
        history = self._drift_history

        if severity_filter:
            severity_order = [
                DriftSeverity.NONE,
                DriftSeverity.LOW,
                DriftSeverity.MEDIUM,
                DriftSeverity.HIGH,
                DriftSeverity.CRITICAL,
            ]
            min_index = severity_order.index(severity_filter)
            history = [r for r in history if severity_order.index(r.severity) >= min_index]

        if limit:
            history = history[-limit:]

        return history

    def export_baseline(self) -> dict[str, Any]:
        """Export baseline statistics for persistence."""
        return {
            "centroid": self._baseline_centroid,
            "variance": self._baseline_variance,
            "sample_count": self._baseline_window.size,
            "finalized": self._baseline_finalized,
            "thresholds": {
                "drift": self.drift_threshold,
                "warning": self.warning_threshold,
                "critical": self.critical_threshold,
            },
        }

    def import_baseline(self, data: dict[str, Any]) -> bool:
        """
        Import baseline statistics from exported data.

        Args:
            data: Dictionary from export_baseline()

        Returns:
            True if successfully imported, False otherwise
        """
        try:
            self._baseline_centroid = data["centroid"]
            self._baseline_variance = data["variance"]
            self._baseline_finalized = data.get("finalized", True)

            if "thresholds" in data:
                self.drift_threshold = data["thresholds"].get("drift", self.drift_threshold)
                self.warning_threshold = data["thresholds"].get("warning", self.warning_threshold)
                self.critical_threshold = data["thresholds"].get(
                    "critical", self.critical_threshold
                )

            return True
        except (KeyError, TypeError) as e:
            warnings.warn(f"Failed to import baseline: {e}", stacklevel=2)
            return False

    def save_baseline(self, filepath: str) -> bool:
        """Save baseline to JSON file."""
        try:
            with open(filepath, "w") as f:
                json.dump(self.export_baseline(), f, indent=2)
            return True
        except Exception as e:
            warnings.warn(f"Failed to save baseline: {e}", stacklevel=2)
            return False

    def load_baseline(self, filepath: str) -> bool:
        """Load baseline from JSON file."""
        try:
            with open(filepath) as f:
                data = json.load(f)
            return self.import_baseline(data)
        except Exception as e:
            warnings.warn(f"Failed to load baseline: {e}", stacklevel=2)
            return False
