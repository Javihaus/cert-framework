"""
EU Database Registration for High-Risk AI Systems

Implements EU AI Act Article 71 requirements for registration
of high-risk AI systems in the EU database.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any
from enum import Enum
import json


class RegistrationStatus(Enum):
    """Registration status."""
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


@dataclass
class RegistrationEntry:
    """EU database registration entry for high-risk AI system."""

    # Provider Information
    provider_name: str
    provider_address: str
    provider_country: str
    provider_contact_email: str
    provider_registration_number: str = ""

    # System Information
    system_name: str
    system_version: str
    system_description: str
    intended_purpose: str
    risk_category: str  # Annex III category

    # Technical Details
    ai_techniques: list[str] = field(default_factory=list)
    data_types: list[str] = field(default_factory=list)
    hardware_requirements: str = ""
    deployment_context: str = ""

    # Compliance Information
    conformity_assessment_type: str = ""
    notified_body_id: str | None = None
    ce_marking_applied: bool = False
    declaration_of_conformity_url: str = ""

    # Registration Metadata
    registration_id: str = ""
    status: RegistrationStatus = RegistrationStatus.DRAFT
    submission_date: datetime | None = None
    approval_date: datetime | None = None
    last_updated: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "provider_information": {
                "name": self.provider_name,
                "address": self.provider_address,
                "country": self.provider_country,
                "contact_email": self.provider_contact_email,
                "registration_number": self.provider_registration_number,
            },
            "system_information": {
                "name": self.system_name,
                "version": self.system_version,
                "description": self.system_description,
                "intended_purpose": self.intended_purpose,
                "risk_category": self.risk_category,
            },
            "technical_details": {
                "ai_techniques": self.ai_techniques,
                "data_types": self.data_types,
                "hardware_requirements": self.hardware_requirements,
                "deployment_context": self.deployment_context,
            },
            "compliance_information": {
                "conformity_assessment_type": self.conformity_assessment_type,
                "notified_body_id": self.notified_body_id,
                "ce_marking_applied": self.ce_marking_applied,
                "declaration_of_conformity_url": self.declaration_of_conformity_url,
            },
            "registration_metadata": {
                "registration_id": self.registration_id,
                "status": self.status.value,
                "submission_date": self.submission_date.isoformat() if self.submission_date else None,
                "approval_date": self.approval_date.isoformat() if self.approval_date else None,
                "last_updated": self.last_updated.isoformat(),
            },
        }


class EUDatabaseRegistration:
    """
    EU Database registration manager for high-risk AI systems.

    Implements Article 71 requirements for registration of high-risk
    AI systems in the EU database before placing on market.

    Example:
        registry = EUDatabaseRegistration()

        # Create registration entry
        entry = registry.create_entry(
            provider_name="Acme AI Corp",
            provider_address="123 AI Street, Berlin, Germany",
            provider_country="DE",
            provider_contact_email="compliance@acme.ai",
            system_name="HR Screening Assistant",
            system_version="2.0",
            system_description="AI system for screening job applications",
            intended_purpose="Automated CV screening and candidate ranking",
            risk_category="employment"
        )

        # Validate for submission
        is_valid, issues = registry.validate_entry(entry)

        if is_valid:
            registry.submit_entry(entry)
    """

    def __init__(self):
        """Initialize the registry manager."""
        self._entries: dict[str, RegistrationEntry] = {}
        self._entry_counter = 0

    def _generate_registration_id(self) -> str:
        """Generate unique registration ID."""
        self._entry_counter += 1
        timestamp = int(datetime.utcnow().timestamp())
        return f"EU-AI-{timestamp}-{self._entry_counter:06d}"

    def create_entry(
        self,
        provider_name: str,
        provider_address: str,
        provider_country: str,
        provider_contact_email: str,
        system_name: str,
        system_version: str,
        system_description: str,
        intended_purpose: str,
        risk_category: str,
        **kwargs: Any,
    ) -> RegistrationEntry:
        """
        Create a new registration entry.

        Args:
            provider_name: Legal name of provider
            provider_address: Provider address
            provider_country: ISO country code
            provider_contact_email: Contact email
            system_name: AI system name
            system_version: System version
            system_description: System description
            intended_purpose: Intended purpose
            risk_category: Annex III risk category

        Returns:
            RegistrationEntry instance
        """
        entry = RegistrationEntry(
            provider_name=provider_name,
            provider_address=provider_address,
            provider_country=provider_country,
            provider_contact_email=provider_contact_email,
            provider_registration_number=kwargs.get("provider_registration_number", ""),
            system_name=system_name,
            system_version=system_version,
            system_description=system_description,
            intended_purpose=intended_purpose,
            risk_category=risk_category,
            ai_techniques=kwargs.get("ai_techniques", []),
            data_types=kwargs.get("data_types", []),
            hardware_requirements=kwargs.get("hardware_requirements", ""),
            deployment_context=kwargs.get("deployment_context", ""),
            conformity_assessment_type=kwargs.get("conformity_assessment_type", ""),
            notified_body_id=kwargs.get("notified_body_id"),
            ce_marking_applied=kwargs.get("ce_marking_applied", False),
            declaration_of_conformity_url=kwargs.get("declaration_of_conformity_url", ""),
            registration_id=self._generate_registration_id(),
            status=RegistrationStatus.DRAFT,
        )

        self._entries[entry.registration_id] = entry
        return entry

    def validate_entry(
        self,
        entry: RegistrationEntry,
    ) -> tuple[bool, list[str]]:
        """
        Validate entry for submission.

        Args:
            entry: Entry to validate

        Returns:
            Tuple of (is_valid, list of issues)
        """
        issues = []

        # Required provider fields
        if not entry.provider_name:
            issues.append("Provider name is required")
        if not entry.provider_address:
            issues.append("Provider address is required")
        if not entry.provider_country:
            issues.append("Provider country is required")
        if not entry.provider_contact_email:
            issues.append("Provider contact email is required")

        # Required system fields
        if not entry.system_name:
            issues.append("System name is required")
        if not entry.system_version:
            issues.append("System version is required")
        if not entry.system_description:
            issues.append("System description is required")
        if not entry.intended_purpose:
            issues.append("Intended purpose is required")
        if not entry.risk_category:
            issues.append("Risk category is required")

        # Compliance requirements
        if not entry.conformity_assessment_type:
            issues.append("Conformity assessment type is required")
        if not entry.ce_marking_applied:
            issues.append("CE marking must be applied before registration")

        # Description length checks
        if entry.system_description and len(entry.system_description) < 50:
            issues.append("System description should be more detailed (min 50 characters)")
        if entry.intended_purpose and len(entry.intended_purpose) < 20:
            issues.append("Intended purpose should be more detailed (min 20 characters)")

        return len(issues) == 0, issues

    def submit_entry(
        self,
        entry: RegistrationEntry,
    ) -> tuple[bool, str]:
        """
        Submit entry to EU database.

        Note: This is a simulation. In production, this would
        integrate with the actual EU database API.

        Args:
            entry: Entry to submit

        Returns:
            Tuple of (success, message)
        """
        is_valid, issues = self.validate_entry(entry)

        if not is_valid:
            return False, f"Validation failed: {'; '.join(issues)}"

        entry.status = RegistrationStatus.SUBMITTED
        entry.submission_date = datetime.utcnow()
        entry.last_updated = datetime.utcnow()

        return True, f"Entry {entry.registration_id} submitted successfully"

    def update_status(
        self,
        registration_id: str,
        new_status: RegistrationStatus,
    ) -> bool:
        """Update entry status."""
        if registration_id not in self._entries:
            return False

        entry = self._entries[registration_id]
        entry.status = new_status
        entry.last_updated = datetime.utcnow()

        if new_status == RegistrationStatus.APPROVED:
            entry.approval_date = datetime.utcnow()

        return True

    def get_entry(self, registration_id: str) -> RegistrationEntry | None:
        """Get entry by registration ID."""
        return self._entries.get(registration_id)

    def list_entries(
        self,
        status_filter: RegistrationStatus | None = None,
    ) -> list[RegistrationEntry]:
        """List all entries with optional status filter."""
        entries = list(self._entries.values())

        if status_filter:
            entries = [e for e in entries if e.status == status_filter]

        return entries

    def export_entry(
        self,
        entry: RegistrationEntry,
        filepath: str,
    ) -> bool:
        """Export entry to JSON file."""
        try:
            with open(filepath, "w") as f:
                json.dump(entry.to_dict(), f, indent=2)
            return True
        except Exception:
            return False

    def generate_registration_summary(
        self,
        entry: RegistrationEntry,
    ) -> str:
        """Generate human-readable registration summary."""
        summary = f"""
EU AI Database Registration Summary
===================================

Registration ID: {entry.registration_id}
Status: {entry.status.value.upper()}

PROVIDER INFORMATION
--------------------
Name: {entry.provider_name}
Address: {entry.provider_address}
Country: {entry.provider_country}
Contact: {entry.provider_contact_email}

AI SYSTEM INFORMATION
---------------------
Name: {entry.system_name}
Version: {entry.system_version}
Risk Category: {entry.risk_category}

Intended Purpose:
{entry.intended_purpose}

Description:
{entry.system_description}

COMPLIANCE STATUS
-----------------
Conformity Assessment: {entry.conformity_assessment_type}
CE Marking Applied: {'Yes' if entry.ce_marking_applied else 'No'}
Notified Body: {entry.notified_body_id or 'N/A'}

DATES
-----
Last Updated: {entry.last_updated.strftime('%Y-%m-%d %H:%M')}
"""

        if entry.submission_date:
            summary += f"Submitted: {entry.submission_date.strftime('%Y-%m-%d %H:%M')}\n"
        if entry.approval_date:
            summary += f"Approved: {entry.approval_date.strftime('%Y-%m-%d %H:%M')}\n"

        return summary
