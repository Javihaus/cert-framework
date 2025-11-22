"""
Human Oversight Implementation for High-Risk AI Systems

Implements EU AI Act Article 14 requirements for human oversight
of high-risk AI systems.
"""

import functools
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Callable


class OversightLevel(Enum):
    """Levels of human oversight required."""

    MINIMAL = "minimal"  # Periodic review
    STANDARD = "standard"  # Regular monitoring
    ENHANCED = "enhanced"  # Real-time monitoring
    MANDATORY = "mandatory"  # Human approval required


class EscalationPolicy(Enum):
    """Escalation policies for human oversight."""

    IMMEDIATE = "immediate"  # Escalate immediately
    THRESHOLD = "threshold"  # Escalate when threshold exceeded
    PERIODIC = "periodic"  # Periodic review
    ON_DEMAND = "on_demand"  # On request only


@dataclass
class OversightEvent:
    """Record of a human oversight event."""

    event_id: str
    event_type: str  # "intervention", "approval", "review", "override"
    decision: str
    confidence_score: float | None = None
    human_decision: str | None = None
    was_overridden: bool = False
    reviewer_id: str | None = None
    timestamp: datetime = field(default_factory=datetime.utcnow)
    notes: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "event_id": self.event_id,
            "event_type": self.event_type,
            "decision": self.decision,
            "confidence_score": self.confidence_score,
            "human_decision": self.human_decision,
            "was_overridden": self.was_overridden,
            "reviewer_id": self.reviewer_id,
            "timestamp": self.timestamp.isoformat(),
            "notes": self.notes,
            "metadata": self.metadata,
        }


@dataclass
class OversightConfig:
    """Configuration for human oversight."""

    level: OversightLevel = OversightLevel.STANDARD
    confidence_threshold: float = 0.7  # Below this, require human review
    escalation_policy: EscalationPolicy = EscalationPolicy.THRESHOLD
    review_sample_rate: float = 0.1  # Sample rate for periodic review
    max_auto_decisions: int = 100  # Max decisions before mandatory review
    require_explanation: bool = True


class HumanOversight:
    """
    Human oversight management for high-risk AI systems.

    Implements Article 14 of the EU AI Act, providing:
    - Confidence-based escalation
    - Human approval workflows
    - Override capabilities
    - Audit trail of human interventions

    Example:
        oversight = HumanOversight(
            config=OversightConfig(
                confidence_threshold=0.8,
                escalation_policy=EscalationPolicy.THRESHOLD
            )
        )

        # Check if human review needed
        if oversight.requires_review(confidence=0.6, decision="approve_loan"):
            human_decision = get_human_input()
            oversight.record_intervention(
                decision="approve_loan",
                human_decision=human_decision
            )
    """

    def __init__(
        self,
        config: OversightConfig | None = None,
        approval_callback: Callable[[str, dict], str] | None = None,
    ):
        """
        Initialize human oversight.

        Args:
            config: Oversight configuration
            approval_callback: Callback for getting human approval
        """
        self.config = config or OversightConfig()
        self.approval_callback = approval_callback

        self._events: list[OversightEvent] = []
        self._auto_decisions_count = 0
        self._event_counter = 0

    def _generate_event_id(self) -> str:
        """Generate unique event ID."""
        self._event_counter += 1
        timestamp = int(datetime.utcnow().timestamp() * 1000)
        return f"oversight_{timestamp}_{self._event_counter}"

    def requires_review(
        self,
        confidence: float | None = None,
        decision: str = "",
        context: dict[str, Any] | None = None,
    ) -> bool:
        """
        Check if human review is required.

        Args:
            confidence: AI system's confidence in the decision
            decision: The decision being made
            context: Additional context

        Returns:
            True if human review is required
        """
        # Mandatory level always requires review
        if self.config.level == OversightLevel.MANDATORY:
            return True

        # Check confidence threshold
        if confidence is not None and confidence < self.config.confidence_threshold:
            return True

        # Check auto-decision limit
        if self._auto_decisions_count >= self.config.max_auto_decisions:
            return True

        # Periodic sampling for standard level
        if self.config.level == OversightLevel.STANDARD:
            import random

            if random.random() < self.config.review_sample_rate:
                return True

        return False

    def record_auto_decision(
        self,
        decision: str,
        confidence: float,
        metadata: dict[str, Any] | None = None,
    ) -> OversightEvent:
        """
        Record an automatic decision made without human review.

        Args:
            decision: The decision made
            confidence: Confidence score
            metadata: Additional metadata

        Returns:
            OversightEvent record
        """
        event = OversightEvent(
            event_id=self._generate_event_id(),
            event_type="auto_decision",
            decision=decision,
            confidence_score=confidence,
            metadata=metadata or {},
        )

        self._events.append(event)
        self._auto_decisions_count += 1

        return event

    def record_intervention(
        self,
        decision: str,
        human_decision: str,
        confidence: float | None = None,
        reviewer_id: str | None = None,
        was_overridden: bool = False,
        notes: str = "",
        metadata: dict[str, Any] | None = None,
    ) -> OversightEvent:
        """
        Record a human intervention.

        Args:
            decision: The AI's decision
            human_decision: The human's decision
            confidence: AI confidence (if available)
            reviewer_id: ID of the human reviewer
            was_overridden: Whether AI decision was overridden
            notes: Additional notes
            metadata: Additional metadata

        Returns:
            OversightEvent record
        """
        event = OversightEvent(
            event_id=self._generate_event_id(),
            event_type="intervention",
            decision=decision,
            confidence_score=confidence,
            human_decision=human_decision,
            was_overridden=was_overridden,
            reviewer_id=reviewer_id,
            notes=notes,
            metadata=metadata or {},
        )

        self._events.append(event)
        self._auto_decisions_count = 0  # Reset counter after human review

        return event

    def request_approval(
        self,
        decision: str,
        context: dict[str, Any],
    ) -> tuple[bool, str]:
        """
        Request human approval for a decision.

        Args:
            decision: The proposed decision
            context: Context for the decision

        Returns:
            Tuple of (approved, human_decision)
        """
        if self.approval_callback:
            human_decision = self.approval_callback(decision, context)
            approved = human_decision.lower() in ["approve", "yes", "accept"]
            return approved, human_decision
        else:
            # No callback - raise for manual handling
            raise RuntimeError("Human approval required but no approval_callback configured")

    def override(
        self,
        original_decision: str,
        new_decision: str,
        reviewer_id: str,
        reason: str,
        metadata: dict[str, Any] | None = None,
    ) -> OversightEvent:
        """
        Override an AI decision.

        Args:
            original_decision: The AI's original decision
            new_decision: The human's override decision
            reviewer_id: ID of the reviewer
            reason: Reason for override
            metadata: Additional metadata

        Returns:
            OversightEvent record
        """
        event = OversightEvent(
            event_id=self._generate_event_id(),
            event_type="override",
            decision=original_decision,
            human_decision=new_decision,
            was_overridden=True,
            reviewer_id=reviewer_id,
            notes=reason,
            metadata=metadata or {},
        )

        self._events.append(event)
        return event

    def get_statistics(self) -> dict[str, Any]:
        """Get oversight statistics."""
        total_events = len(self._events)

        interventions = [e for e in self._events if e.event_type == "intervention"]
        overrides = [e for e in self._events if e.was_overridden]
        auto_decisions = [e for e in self._events if e.event_type == "auto_decision"]

        return {
            "total_events": total_events,
            "interventions": len(interventions),
            "overrides": len(overrides),
            "auto_decisions": len(auto_decisions),
            "override_rate": len(overrides) / len(interventions) if interventions else 0,
            "human_involvement_rate": len(interventions) / total_events if total_events else 0,
            "current_auto_decisions_count": self._auto_decisions_count,
            "config": {
                "level": self.config.level.value,
                "confidence_threshold": self.config.confidence_threshold,
                "escalation_policy": self.config.escalation_policy.value,
            },
        }

    def export_audit_trail(
        self,
        filepath: str,
    ) -> bool:
        """Export oversight audit trail to file."""
        import json

        try:
            data = [e.to_dict() for e in self._events]
            with open(filepath, "w") as f:
                json.dump(data, f, indent=2)
            return True
        except Exception:
            return False


def requires_human_oversight(
    confidence_threshold: float = 0.7,
    escalation_policy: str = "threshold",
    require_explanation: bool = True,
):
    """
    Decorator to add human oversight requirements to a function.

    Example:
        @requires_human_oversight(
            confidence_threshold=0.8,
            escalation_policy="immediate"
        )
        def make_decision(data):
            return {"decision": "approve", "confidence": 0.75}
    """

    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)

            # Check if result has confidence score
            if isinstance(result, dict):
                confidence = result.get("confidence")

                if confidence is not None and confidence < confidence_threshold:
                    result["requires_human_review"] = True
                    result["review_reason"] = (
                        f"Confidence {confidence} below threshold {confidence_threshold}"
                    )

                if require_explanation and "explanation" not in result:
                    result["requires_human_review"] = True
                    result["review_reason"] = (
                        result.get("review_reason", "") + " No explanation provided."
                    )

            return result

        # Add metadata to function
        wrapper._oversight_config = {
            "confidence_threshold": confidence_threshold,
            "escalation_policy": escalation_policy,
            "require_explanation": require_explanation,
        }

        return wrapper

    return decorator
