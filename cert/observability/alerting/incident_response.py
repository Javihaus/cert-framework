"""
Incident Response Management

Provides incident tracking and response coordination
for production LLM systems.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any
from enum import Enum
import json


class IncidentSeverity(Enum):
    """Incident severity levels."""
    SEV1 = "sev1"  # Critical - immediate response
    SEV2 = "sev2"  # High - urgent response
    SEV3 = "sev3"  # Medium - normal response
    SEV4 = "sev4"  # Low - scheduled response


class IncidentStatus(Enum):
    """Incident status."""
    OPEN = "open"
    INVESTIGATING = "investigating"
    IDENTIFIED = "identified"
    MITIGATING = "mitigating"
    RESOLVED = "resolved"
    POSTMORTEM = "postmortem"
    CLOSED = "closed"


@dataclass
class IncidentUpdate:
    """Update to an incident."""

    message: str
    author: str
    timestamp: datetime = field(default_factory=datetime.utcnow)
    status_change: IncidentStatus | None = None


@dataclass
class Incident:
    """An incident record."""

    incident_id: str
    title: str
    description: str
    severity: IncidentSeverity
    status: IncidentStatus
    created_at: datetime
    created_by: str
    affected_systems: list[str] = field(default_factory=list)
    related_alerts: list[str] = field(default_factory=list)
    updates: list[IncidentUpdate] = field(default_factory=list)
    resolved_at: datetime | None = None
    root_cause: str = ""
    mitigation: str = ""
    impact: str = ""
    assignee: str = ""

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "incident_id": self.incident_id,
            "title": self.title,
            "description": self.description,
            "severity": self.severity.value,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "created_by": self.created_by,
            "affected_systems": self.affected_systems,
            "related_alerts": self.related_alerts,
            "updates": [
                {
                    "message": u.message,
                    "author": u.author,
                    "timestamp": u.timestamp.isoformat(),
                    "status_change": u.status_change.value if u.status_change else None,
                }
                for u in self.updates
            ],
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "root_cause": self.root_cause,
            "mitigation": self.mitigation,
            "impact": self.impact,
            "assignee": self.assignee,
        }


class IncidentResponse:
    """
    Incident response management for LLM systems.

    Tracks incidents, coordinates response, and manages
    incident lifecycle including postmortems.

    Example:
        ir = IncidentResponse()

        # Create incident
        incident = ir.create_incident(
            title="High error rate on chat endpoint",
            description="Error rate spiked to 15%",
            severity=IncidentSeverity.SEV2,
            created_by="oncall@company.com"
        )

        # Update incident
        ir.add_update(incident.incident_id,
                      "Identified root cause: API rate limit",
                      "oncall@company.com")

        # Resolve
        ir.resolve_incident(incident.incident_id,
                           root_cause="API rate limit exceeded",
                           mitigation="Implemented request throttling")
    """

    def __init__(self):
        """Initialize incident response."""
        self._incidents: dict[str, Incident] = {}
        self._incident_counter = 0

    def _generate_incident_id(self) -> str:
        """Generate unique incident ID."""
        self._incident_counter += 1
        return f"INC-{datetime.utcnow().strftime('%Y%m%d')}-{self._incident_counter:04d}"

    def create_incident(
        self,
        title: str,
        description: str,
        severity: IncidentSeverity,
        created_by: str,
        affected_systems: list[str] | None = None,
        related_alerts: list[str] | None = None,
    ) -> Incident:
        """
        Create a new incident.

        Args:
            title: Incident title
            description: Incident description
            severity: Severity level
            created_by: Creator identifier
            affected_systems: List of affected systems
            related_alerts: Related alert IDs

        Returns:
            Created Incident
        """
        incident = Incident(
            incident_id=self._generate_incident_id(),
            title=title,
            description=description,
            severity=severity,
            status=IncidentStatus.OPEN,
            created_at=datetime.utcnow(),
            created_by=created_by,
            affected_systems=affected_systems or [],
            related_alerts=related_alerts or [],
        )

        self._incidents[incident.incident_id] = incident
        return incident

    def add_update(
        self,
        incident_id: str,
        message: str,
        author: str,
        new_status: IncidentStatus | None = None,
    ) -> bool:
        """
        Add an update to an incident.

        Args:
            incident_id: Incident ID
            message: Update message
            author: Author of update
            new_status: Optional status change

        Returns:
            True if successful
        """
        if incident_id not in self._incidents:
            return False

        incident = self._incidents[incident_id]
        update = IncidentUpdate(
            message=message,
            author=author,
            status_change=new_status,
        )

        incident.updates.append(update)

        if new_status:
            incident.status = new_status

        return True

    def assign_incident(
        self,
        incident_id: str,
        assignee: str,
    ) -> bool:
        """Assign incident to a responder."""
        if incident_id not in self._incidents:
            return False

        self._incidents[incident_id].assignee = assignee
        return True

    def resolve_incident(
        self,
        incident_id: str,
        root_cause: str,
        mitigation: str,
        resolved_by: str,
    ) -> bool:
        """
        Resolve an incident.

        Args:
            incident_id: Incident ID
            root_cause: Root cause analysis
            mitigation: Mitigation steps taken
            resolved_by: Resolver identifier

        Returns:
            True if successful
        """
        if incident_id not in self._incidents:
            return False

        incident = self._incidents[incident_id]
        incident.status = IncidentStatus.RESOLVED
        incident.resolved_at = datetime.utcnow()
        incident.root_cause = root_cause
        incident.mitigation = mitigation

        self.add_update(
            incident_id,
            f"Incident resolved. Root cause: {root_cause}",
            resolved_by,
            IncidentStatus.RESOLVED,
        )

        return True

    def get_incident(self, incident_id: str) -> Incident | None:
        """Get incident by ID."""
        return self._incidents.get(incident_id)

    def get_open_incidents(
        self,
        severity_filter: IncidentSeverity | None = None,
    ) -> list[Incident]:
        """Get all open incidents."""
        open_statuses = [
            IncidentStatus.OPEN,
            IncidentStatus.INVESTIGATING,
            IncidentStatus.IDENTIFIED,
            IncidentStatus.MITIGATING,
        ]

        incidents = [
            i for i in self._incidents.values()
            if i.status in open_statuses
        ]

        if severity_filter:
            incidents = [i for i in incidents if i.severity == severity_filter]

        return sorted(incidents, key=lambda i: i.created_at, reverse=True)

    def get_summary(self) -> dict[str, Any]:
        """Get incident summary."""
        open_incidents = self.get_open_incidents()

        return {
            "total_incidents": len(self._incidents),
            "open_incidents": len(open_incidents),
            "by_severity": {
                sev.value: len([
                    i for i in open_incidents if i.severity == sev
                ])
                for sev in IncidentSeverity
            },
        }

    def export_incident(
        self,
        incident_id: str,
        filepath: str,
    ) -> bool:
        """Export incident to JSON."""
        incident = self._incidents.get(incident_id)
        if not incident:
            return False

        try:
            with open(filepath, "w") as f:
                json.dump(incident.to_dict(), f, indent=2)
            return True
        except Exception:
            return False
