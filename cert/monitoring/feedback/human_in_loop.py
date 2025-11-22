"""
Human-in-the-Loop Feedback Collection for LLM Systems

This module provides infrastructure for collecting, managing, and analyzing
human feedback on LLM outputs for quality monitoring and improvement.

Key Features:
- Thumbs up/down feedback
- Explicit ratings (1-5 stars)
- Text annotations and corrections
- Feedback aggregation and analysis
- Integration with golden dataset management
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Callable
from collections import deque
from enum import Enum
import statistics
import json


class FeedbackType(Enum):
    """Types of human feedback."""
    THUMBS = "thumbs"  # Binary good/bad
    RATING = "rating"  # 1-5 star rating
    CORRECTION = "correction"  # Text correction
    ANNOTATION = "annotation"  # Free-form annotation
    PREFERENCE = "preference"  # A/B preference


class FeedbackSignal(Enum):
    """Implicit feedback signals."""
    REGENERATION = "regeneration"  # User requested regeneration
    COPY = "copy"  # User copied response
    EDIT = "edit"  # User edited response
    ABANDON = "abandon"  # User abandoned conversation


@dataclass
class Feedback:
    """A single piece of human feedback."""

    feedback_id: str
    request_id: str
    feedback_type: FeedbackType
    value: Any  # True/False for thumbs, 1-5 for rating, string for correction
    user_id: str | None = None
    prompt: str = ""
    response: str = ""
    corrected_response: str | None = None
    annotation: str | None = None
    timestamp: datetime = field(default_factory=datetime.utcnow)
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "feedback_id": self.feedback_id,
            "request_id": self.request_id,
            "feedback_type": self.feedback_type.value,
            "value": self.value,
            "user_id": self.user_id,
            "prompt": self.prompt,
            "response": self.response,
            "corrected_response": self.corrected_response,
            "annotation": self.annotation,
            "timestamp": self.timestamp.isoformat(),
            "metadata": self.metadata,
        }


@dataclass
class FeedbackStats:
    """Aggregated feedback statistics."""

    total_feedback: int
    positive_count: int
    negative_count: int
    positive_rate: float
    average_rating: float | None
    rating_distribution: dict[int, int]
    feedback_rate: float  # Feedback per request
    corrections_count: int
    period_start: datetime
    period_end: datetime

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "total_feedback": self.total_feedback,
            "positive_count": self.positive_count,
            "negative_count": self.negative_count,
            "positive_rate": self.positive_rate,
            "average_rating": self.average_rating,
            "rating_distribution": self.rating_distribution,
            "feedback_rate": self.feedback_rate,
            "corrections_count": self.corrections_count,
            "period_start": self.period_start.isoformat(),
            "period_end": self.period_end.isoformat(),
        }


class HumanFeedbackCollector:
    """
    Collects and manages human feedback on LLM outputs.

    Provides infrastructure for:
    - Collecting various feedback types
    - Tracking implicit signals (regeneration, copy, abandon)
    - Aggregating feedback statistics
    - Identifying patterns in negative feedback
    - Exporting feedback for model improvement

    Example:
        collector = HumanFeedbackCollector()

        # Record thumbs feedback
        collector.record_thumbs(
            request_id="req_123",
            positive=True,
            prompt="What is AI?",
            response="AI is..."
        )

        # Record rating
        collector.record_rating(
            request_id="req_456",
            rating=4,
            prompt="Summarize this text",
            response="Summary: ..."
        )

        # Get statistics
        stats = collector.get_stats(window_hours=24)
        print(f"Positive rate: {stats.positive_rate:.1%}")
    """

    def __init__(
        self,
        max_history: int = 100000,
        on_negative_feedback: Callable[[Feedback], None] | None = None,
        negative_threshold: float = 0.3,  # Alert if positive rate drops below
    ):
        """
        Initialize the feedback collector.

        Args:
            max_history: Maximum feedback records to keep
            on_negative_feedback: Callback when negative feedback received
            negative_threshold: Threshold for negative feedback alerts
        """
        self.max_history = max_history
        self.on_negative_feedback = on_negative_feedback
        self.negative_threshold = negative_threshold

        self._feedback: deque[Feedback] = deque(maxlen=max_history)
        self._signals: deque[dict[str, Any]] = deque(maxlen=max_history)
        self._counter = 0
        self._total_requests = 0

    def _generate_id(self) -> str:
        """Generate unique feedback ID."""
        self._counter += 1
        timestamp = int(datetime.utcnow().timestamp() * 1000)
        return f"fb_{timestamp}_{self._counter}"

    def record_thumbs(
        self,
        request_id: str,
        positive: bool,
        prompt: str = "",
        response: str = "",
        user_id: str | None = None,
        annotation: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> Feedback:
        """
        Record thumbs up/down feedback.

        Args:
            request_id: ID of the request being rated
            positive: True for thumbs up, False for thumbs down
            prompt: The original prompt
            response: The LLM response
            user_id: Optional user identifier
            annotation: Optional text annotation
            metadata: Additional metadata

        Returns:
            The recorded Feedback object
        """
        feedback = Feedback(
            feedback_id=self._generate_id(),
            request_id=request_id,
            feedback_type=FeedbackType.THUMBS,
            value=positive,
            user_id=user_id,
            prompt=prompt,
            response=response,
            annotation=annotation,
            metadata=metadata or {},
        )

        self._feedback.append(feedback)

        if not positive and self.on_negative_feedback:
            self.on_negative_feedback(feedback)

        return feedback

    def record_rating(
        self,
        request_id: str,
        rating: int,  # 1-5
        prompt: str = "",
        response: str = "",
        user_id: str | None = None,
        annotation: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> Feedback:
        """
        Record 1-5 star rating.

        Args:
            request_id: ID of the request being rated
            rating: Rating from 1-5
            prompt: The original prompt
            response: The LLM response
            user_id: Optional user identifier
            annotation: Optional text annotation
            metadata: Additional metadata

        Returns:
            The recorded Feedback object
        """
        rating = max(1, min(5, rating))  # Clamp to 1-5

        feedback = Feedback(
            feedback_id=self._generate_id(),
            request_id=request_id,
            feedback_type=FeedbackType.RATING,
            value=rating,
            user_id=user_id,
            prompt=prompt,
            response=response,
            annotation=annotation,
            metadata=metadata or {},
        )

        self._feedback.append(feedback)

        if rating <= 2 and self.on_negative_feedback:
            self.on_negative_feedback(feedback)

        return feedback

    def record_correction(
        self,
        request_id: str,
        original_response: str,
        corrected_response: str,
        prompt: str = "",
        user_id: str | None = None,
        annotation: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> Feedback:
        """
        Record a text correction.

        Args:
            request_id: ID of the request being corrected
            original_response: The original LLM response
            corrected_response: The human-corrected response
            prompt: The original prompt
            user_id: Optional user identifier
            annotation: Optional explanation of correction
            metadata: Additional metadata

        Returns:
            The recorded Feedback object
        """
        feedback = Feedback(
            feedback_id=self._generate_id(),
            request_id=request_id,
            feedback_type=FeedbackType.CORRECTION,
            value=None,
            user_id=user_id,
            prompt=prompt,
            response=original_response,
            corrected_response=corrected_response,
            annotation=annotation,
            metadata=metadata or {},
        )

        self._feedback.append(feedback)

        if self.on_negative_feedback:
            self.on_negative_feedback(feedback)

        return feedback

    def record_preference(
        self,
        request_id: str,
        response_a: str,
        response_b: str,
        preferred: str,  # "a" or "b"
        prompt: str = "",
        user_id: str | None = None,
        annotation: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> Feedback:
        """
        Record A/B preference feedback.

        Args:
            request_id: ID of the request
            response_a: First response option
            response_b: Second response option
            preferred: "a" or "b" indicating preference
            prompt: The original prompt
            user_id: Optional user identifier
            annotation: Optional explanation
            metadata: Additional metadata

        Returns:
            The recorded Feedback object
        """
        feedback = Feedback(
            feedback_id=self._generate_id(),
            request_id=request_id,
            feedback_type=FeedbackType.PREFERENCE,
            value=preferred,
            user_id=user_id,
            prompt=prompt,
            response=response_a,
            corrected_response=response_b,
            annotation=annotation,
            metadata=metadata or {},
        )

        self._feedback.append(feedback)
        return feedback

    def record_signal(
        self,
        request_id: str,
        signal: FeedbackSignal,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """
        Record an implicit feedback signal.

        Args:
            request_id: ID of the related request
            signal: The implicit signal type
            metadata: Additional context
        """
        self._signals.append({
            "request_id": request_id,
            "signal": signal.value,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata or {},
        })

    def increment_request_count(self, count: int = 1) -> None:
        """Increment the total request count for feedback rate calculation."""
        self._total_requests += count

    def get_stats(
        self,
        window_hours: int | None = None,
        user_id: str | None = None,
    ) -> FeedbackStats:
        """
        Get aggregated feedback statistics.

        Args:
            window_hours: Time window in hours
            user_id: Filter by user

        Returns:
            FeedbackStats with aggregated data
        """
        records = list(self._feedback)

        if window_hours:
            cutoff = datetime.utcnow() - timedelta(hours=window_hours)
            records = [r for r in records if r.timestamp >= cutoff]

        if user_id:
            records = [r for r in records if r.user_id == user_id]

        if not records:
            now = datetime.utcnow()
            return FeedbackStats(
                total_feedback=0,
                positive_count=0,
                negative_count=0,
                positive_rate=0.0,
                average_rating=None,
                rating_distribution={},
                feedback_rate=0.0,
                corrections_count=0,
                period_start=now,
                period_end=now,
            )

        # Count positive/negative from thumbs
        thumbs = [r for r in records if r.feedback_type == FeedbackType.THUMBS]
        positive_count = sum(1 for r in thumbs if r.value is True)
        negative_count = sum(1 for r in thumbs if r.value is False)

        # Rating statistics
        ratings = [r for r in records if r.feedback_type == FeedbackType.RATING]
        rating_values = [r.value for r in ratings]
        average_rating = statistics.mean(rating_values) if rating_values else None

        rating_distribution = {}
        for r in ratings:
            rating_distribution[r.value] = rating_distribution.get(r.value, 0) + 1

        # Corrections count
        corrections_count = sum(
            1 for r in records
            if r.feedback_type == FeedbackType.CORRECTION
        )

        # Positive rate (including ratings >= 4 as positive)
        total_sentiment = positive_count + negative_count
        for r in ratings:
            if r.value >= 4:
                positive_count += 1
                total_sentiment += 1
            elif r.value <= 2:
                negative_count += 1
                total_sentiment += 1

        positive_rate = positive_count / total_sentiment if total_sentiment > 0 else 0.0

        # Feedback rate
        feedback_rate = len(records) / self._total_requests if self._total_requests > 0 else 0.0

        return FeedbackStats(
            total_feedback=len(records),
            positive_count=positive_count,
            negative_count=negative_count,
            positive_rate=positive_rate,
            average_rating=average_rating,
            rating_distribution=rating_distribution,
            feedback_rate=feedback_rate,
            corrections_count=corrections_count,
            period_start=min(r.timestamp for r in records),
            period_end=max(r.timestamp for r in records),
        )

    def get_negative_feedback(
        self,
        limit: int = 100,
        window_hours: int | None = None,
    ) -> list[Feedback]:
        """
        Get negative feedback for analysis.

        Args:
            limit: Maximum records to return
            window_hours: Time window filter

        Returns:
            List of negative feedback records
        """
        records = list(self._feedback)

        if window_hours:
            cutoff = datetime.utcnow() - timedelta(hours=window_hours)
            records = [r for r in records if r.timestamp >= cutoff]

        negative = []
        for r in records:
            if r.feedback_type == FeedbackType.THUMBS and r.value is False:
                negative.append(r)
            elif r.feedback_type == FeedbackType.RATING and r.value <= 2:
                negative.append(r)
            elif r.feedback_type == FeedbackType.CORRECTION:
                negative.append(r)

        return negative[-limit:]

    def get_corrections(
        self,
        limit: int | None = None,
        window_hours: int | None = None,
    ) -> list[Feedback]:
        """
        Get correction feedback for golden dataset creation.

        Args:
            limit: Maximum records to return
            window_hours: Time window filter

        Returns:
            List of correction records
        """
        records = [
            r for r in self._feedback
            if r.feedback_type == FeedbackType.CORRECTION
        ]

        if window_hours:
            cutoff = datetime.utcnow() - timedelta(hours=window_hours)
            records = [r for r in records if r.timestamp >= cutoff]

        if limit:
            records = records[-limit:]

        return records

    def get_signals_summary(
        self,
        window_hours: int = 24,
    ) -> dict[str, int]:
        """
        Get summary of implicit feedback signals.

        Args:
            window_hours: Time window in hours

        Returns:
            Dictionary of signal type to count
        """
        cutoff = datetime.utcnow() - timedelta(hours=window_hours)
        recent = [
            s for s in self._signals
            if datetime.fromisoformat(s["timestamp"]) >= cutoff
        ]

        summary = {}
        for s in recent:
            signal = s["signal"]
            summary[signal] = summary.get(signal, 0) + 1

        return summary

    def export_feedback(
        self,
        filepath: str,
        window_hours: int | None = None,
        format: str = "json",  # "json" or "jsonl"
    ) -> bool:
        """
        Export feedback data to file.

        Args:
            filepath: Output file path
            window_hours: Time window filter
            format: Output format (json or jsonl)

        Returns:
            True if successful
        """
        try:
            records = list(self._feedback)

            if window_hours:
                cutoff = datetime.utcnow() - timedelta(hours=window_hours)
                records = [r for r in records if r.timestamp >= cutoff]

            data = [r.to_dict() for r in records]

            with open(filepath, "w") as f:
                if format == "jsonl":
                    for record in data:
                        f.write(json.dumps(record) + "\n")
                else:
                    json.dump(data, f, indent=2)

            return True
        except Exception:
            return False

    def export_golden_dataset(
        self,
        filepath: str,
        min_rating: int = 4,
    ) -> int:
        """
        Export highly-rated and corrected examples as golden dataset.

        Args:
            filepath: Output file path
            min_rating: Minimum rating to include

        Returns:
            Number of examples exported
        """
        examples = []

        for r in self._feedback:
            # Include corrections
            if r.feedback_type == FeedbackType.CORRECTION and r.corrected_response:
                examples.append({
                    "prompt": r.prompt,
                    "expected_response": r.corrected_response,
                    "source": "human_correction",
                })

            # Include high-rated thumbs
            elif r.feedback_type == FeedbackType.THUMBS and r.value is True:
                if r.prompt and r.response:
                    examples.append({
                        "prompt": r.prompt,
                        "expected_response": r.response,
                        "source": "positive_feedback",
                    })

            # Include high ratings
            elif r.feedback_type == FeedbackType.RATING and r.value >= min_rating:
                if r.prompt and r.response:
                    examples.append({
                        "prompt": r.prompt,
                        "expected_response": r.response,
                        "source": f"rating_{r.value}",
                    })

        try:
            with open(filepath, "w") as f:
                json.dump(examples, f, indent=2)
            return len(examples)
        except Exception:
            return 0
