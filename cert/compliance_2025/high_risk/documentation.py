"""
High-Risk AI System Technical Documentation Generator

Generates EU AI Act Annex IV compliant technical documentation
for high-risk AI systems.
"""

import json
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class SystemDescription:
    """Section 1: General Description of the AI System."""

    name: str
    version: str
    intended_purpose: str
    provider_name: str
    provider_address: str
    date_of_placing: str | None = None
    forms_of_supply: str = "Software as a Service"
    interaction_description: str = ""
    hardware_requirements: str = ""
    software_requirements: str = ""
    product_integration: str | None = None


@dataclass
class SystemElements:
    """Section 2: System Elements and Development Process."""

    development_methods: list[str] = field(default_factory=list)
    design_specifications: str = ""
    system_architecture: str = ""
    components_description: str = ""
    data_requirements: str = ""
    training_approach: str = ""
    validation_approach: str = ""
    testing_approach: str = ""
    model_description: str = ""
    computational_resources: str = ""
    third_party_tools: list[str] = field(default_factory=list)


@dataclass
class DataGovernance:
    """Section 3: Data and Data Governance."""

    data_sources: list[str] = field(default_factory=list)
    data_collection_methods: str = ""
    data_preparation: str = ""
    data_labeling: str = ""
    data_quality_measures: str = ""
    data_bias_analysis: str = ""
    data_privacy_measures: str = ""
    data_retention_policy: str = ""


@dataclass
class PerformanceMetrics:
    """Section 4: Performance and Accuracy."""

    accuracy_metrics: dict[str, float] = field(default_factory=dict)
    robustness_metrics: dict[str, float] = field(default_factory=dict)
    fairness_metrics: dict[str, float] = field(default_factory=dict)
    performance_per_group: dict[str, dict[str, float]] = field(default_factory=dict)
    known_limitations: list[str] = field(default_factory=list)
    foreseeable_risks: list[str] = field(default_factory=list)


@dataclass
class HumanOversightMeasures:
    """Section 5: Human Oversight Measures."""

    oversight_interfaces: list[str] = field(default_factory=list)
    interpretation_aids: list[str] = field(default_factory=list)
    override_mechanisms: list[str] = field(default_factory=list)
    operator_training: str = ""
    intervention_procedures: str = ""


@dataclass
class RiskManagement:
    """Section 6: Risk Management."""

    identified_risks: list[dict[str, str]] = field(default_factory=list)
    risk_mitigation_measures: list[dict[str, str]] = field(default_factory=list)
    residual_risks: list[str] = field(default_factory=list)
    post_market_monitoring_plan: str = ""


@dataclass
class TechnicalDocumentation:
    """Complete technical documentation package."""

    system_description: SystemDescription
    system_elements: SystemElements
    data_governance: DataGovernance
    performance_metrics: PerformanceMetrics
    human_oversight: HumanOversightMeasures
    risk_management: RiskManagement
    document_version: str = "1.0"
    created_date: datetime = field(default_factory=datetime.utcnow)
    last_updated: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "document_version": self.document_version,
            "created_date": self.created_date.isoformat(),
            "last_updated": self.last_updated.isoformat(),
            "section_1_general_description": {
                "name": self.system_description.name,
                "version": self.system_description.version,
                "intended_purpose": self.system_description.intended_purpose,
                "provider_name": self.system_description.provider_name,
                "provider_address": self.system_description.provider_address,
                "date_of_placing": self.system_description.date_of_placing,
                "forms_of_supply": self.system_description.forms_of_supply,
                "interaction_description": self.system_description.interaction_description,
                "hardware_requirements": self.system_description.hardware_requirements,
                "software_requirements": self.system_description.software_requirements,
                "product_integration": self.system_description.product_integration,
            },
            "section_2_system_elements": {
                "development_methods": self.system_elements.development_methods,
                "design_specifications": self.system_elements.design_specifications,
                "system_architecture": self.system_elements.system_architecture,
                "components_description": self.system_elements.components_description,
                "data_requirements": self.system_elements.data_requirements,
                "training_approach": self.system_elements.training_approach,
                "validation_approach": self.system_elements.validation_approach,
                "testing_approach": self.system_elements.testing_approach,
                "model_description": self.system_elements.model_description,
                "computational_resources": self.system_elements.computational_resources,
                "third_party_tools": self.system_elements.third_party_tools,
            },
            "section_3_data_governance": {
                "data_sources": self.data_governance.data_sources,
                "data_collection_methods": self.data_governance.data_collection_methods,
                "data_preparation": self.data_governance.data_preparation,
                "data_labeling": self.data_governance.data_labeling,
                "data_quality_measures": self.data_governance.data_quality_measures,
                "data_bias_analysis": self.data_governance.data_bias_analysis,
                "data_privacy_measures": self.data_governance.data_privacy_measures,
                "data_retention_policy": self.data_governance.data_retention_policy,
            },
            "section_4_performance": {
                "accuracy_metrics": self.performance_metrics.accuracy_metrics,
                "robustness_metrics": self.performance_metrics.robustness_metrics,
                "fairness_metrics": self.performance_metrics.fairness_metrics,
                "performance_per_group": self.performance_metrics.performance_per_group,
                "known_limitations": self.performance_metrics.known_limitations,
                "foreseeable_risks": self.performance_metrics.foreseeable_risks,
            },
            "section_5_human_oversight": {
                "oversight_interfaces": self.human_oversight.oversight_interfaces,
                "interpretation_aids": self.human_oversight.interpretation_aids,
                "override_mechanisms": self.human_oversight.override_mechanisms,
                "operator_training": self.human_oversight.operator_training,
                "intervention_procedures": self.human_oversight.intervention_procedures,
            },
            "section_6_risk_management": {
                "identified_risks": self.risk_management.identified_risks,
                "risk_mitigation_measures": self.risk_management.risk_mitigation_measures,
                "residual_risks": self.risk_management.residual_risks,
                "post_market_monitoring_plan": self.risk_management.post_market_monitoring_plan,
            },
        }


class HighRiskDocumentation:
    """
    Technical documentation generator for high-risk AI systems.

    Generates Annex IV compliant documentation packages for EU AI Act
    high-risk AI system compliance.

    Example:
        generator = HighRiskDocumentation()

        # Create documentation
        doc = generator.create_documentation(
            name="HR Screening System",
            version="2.0",
            intended_purpose="Screen job applications",
            provider_name="Acme Corp",
            provider_address="123 AI Street",
        )

        # Export to JSON
        generator.export_json(doc, "technical_doc.json")
    """

    def create_documentation(
        self,
        name: str,
        version: str,
        intended_purpose: str,
        provider_name: str,
        provider_address: str,
        **kwargs: Any,
    ) -> TechnicalDocumentation:
        """
        Create a new technical documentation package.

        Args:
            name: System name
            version: System version
            intended_purpose: Description of intended purpose
            provider_name: Provider/manufacturer name
            provider_address: Provider address

        Returns:
            TechnicalDocumentation instance
        """
        system_description = SystemDescription(
            name=name,
            version=version,
            intended_purpose=intended_purpose,
            provider_name=provider_name,
            provider_address=provider_address,
            forms_of_supply=kwargs.get("forms_of_supply", "Software as a Service"),
            interaction_description=kwargs.get("interaction_description", ""),
            hardware_requirements=kwargs.get("hardware_requirements", ""),
            software_requirements=kwargs.get("software_requirements", ""),
        )

        system_elements = SystemElements(
            development_methods=kwargs.get("development_methods", []),
            design_specifications=kwargs.get("design_specifications", ""),
            system_architecture=kwargs.get("system_architecture", ""),
            model_description=kwargs.get("model_description", ""),
        )

        data_governance = DataGovernance(
            data_sources=kwargs.get("data_sources", []),
            data_quality_measures=kwargs.get("data_quality_measures", ""),
            data_privacy_measures=kwargs.get("data_privacy_measures", ""),
        )

        performance_metrics = PerformanceMetrics(
            accuracy_metrics=kwargs.get("accuracy_metrics", {}),
            known_limitations=kwargs.get("known_limitations", []),
            foreseeable_risks=kwargs.get("foreseeable_risks", []),
        )

        human_oversight = HumanOversightMeasures(
            oversight_interfaces=kwargs.get("oversight_interfaces", []),
            override_mechanisms=kwargs.get("override_mechanisms", []),
        )

        risk_management = RiskManagement(
            identified_risks=kwargs.get("identified_risks", []),
            risk_mitigation_measures=kwargs.get("risk_mitigation_measures", []),
        )

        return TechnicalDocumentation(
            system_description=system_description,
            system_elements=system_elements,
            data_governance=data_governance,
            performance_metrics=performance_metrics,
            human_oversight=human_oversight,
            risk_management=risk_management,
        )

    def validate_completeness(
        self,
        doc: TechnicalDocumentation,
    ) -> dict[str, list[str]]:
        """
        Validate documentation completeness.

        Returns:
            Dictionary with missing fields per section
        """
        missing = {
            "section_1": [],
            "section_2": [],
            "section_3": [],
            "section_4": [],
            "section_5": [],
            "section_6": [],
        }

        # Check Section 1
        if not doc.system_description.name:
            missing["section_1"].append("name")
        if not doc.system_description.intended_purpose:
            missing["section_1"].append("intended_purpose")
        if not doc.system_description.provider_name:
            missing["section_1"].append("provider_name")

        # Check Section 2
        if not doc.system_elements.system_architecture:
            missing["section_2"].append("system_architecture")
        if not doc.system_elements.model_description:
            missing["section_2"].append("model_description")

        # Check Section 3
        if not doc.data_governance.data_sources:
            missing["section_3"].append("data_sources")
        if not doc.data_governance.data_quality_measures:
            missing["section_3"].append("data_quality_measures")

        # Check Section 4
        if not doc.performance_metrics.accuracy_metrics:
            missing["section_4"].append("accuracy_metrics")

        # Check Section 5
        if not doc.human_oversight.oversight_interfaces:
            missing["section_5"].append("oversight_interfaces")
        if not doc.human_oversight.override_mechanisms:
            missing["section_5"].append("override_mechanisms")

        # Check Section 6
        if not doc.risk_management.identified_risks:
            missing["section_6"].append("identified_risks")

        return missing

    def export_json(
        self,
        doc: TechnicalDocumentation,
        filepath: str,
    ) -> bool:
        """Export documentation to JSON file."""
        try:
            with open(filepath, "w") as f:
                json.dump(doc.to_dict(), f, indent=2)
            return True
        except Exception:
            return False

    def generate_summary(
        self,
        doc: TechnicalDocumentation,
    ) -> str:
        """Generate a human-readable summary of the documentation."""
        summary = f"""
EU AI Act Technical Documentation Summary
=========================================

System: {doc.system_description.name} v{doc.system_description.version}
Provider: {doc.system_description.provider_name}
Purpose: {doc.system_description.intended_purpose}

Document Version: {doc.document_version}
Last Updated: {doc.last_updated.isoformat()}

Completeness Check:
"""
        missing = self.validate_completeness(doc)
        total_missing = sum(len(m) for m in missing.values())

        if total_missing == 0:
            summary += "  All required fields are complete.\n"
        else:
            summary += f"  {total_missing} fields require attention:\n"
            for section, fields in missing.items():
                if fields:
                    summary += f"    {section}: {', '.join(fields)}\n"

        return summary
