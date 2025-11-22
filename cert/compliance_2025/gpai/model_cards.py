"""
GPAI Model Card Generator

Generates EU AI Act compliant model cards for General-Purpose AI models
as required by Article 53.
"""

import json
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class ModelIdentification:
    """Model identification section."""

    model_name: str
    version: str
    provider_name: str
    provider_address: str
    release_date: str
    model_type: str  # e.g., "Large Language Model", "Vision Model"
    modalities: list[str] = field(default_factory=list)  # text, image, audio, etc.
    license_type: str = ""
    contact_email: str = ""


@dataclass
class TrainingInformation:
    """Training data and methodology information."""

    training_data_description: str = ""
    data_sources: list[str] = field(default_factory=list)
    data_preprocessing: str = ""
    training_methodology: str = ""
    compute_resources: str = ""
    training_duration: str = ""
    training_cost_estimate: str = ""
    energy_consumption: str = ""
    carbon_footprint: str = ""


@dataclass
class CapabilitiesLimitations:
    """Model capabilities and limitations."""

    primary_capabilities: list[str] = field(default_factory=list)
    intended_use_cases: list[str] = field(default_factory=list)
    out_of_scope_uses: list[str] = field(default_factory=list)
    known_limitations: list[str] = field(default_factory=list)
    failure_modes: list[str] = field(default_factory=list)
    performance_boundaries: dict[str, str] = field(default_factory=dict)


@dataclass
class EvaluationResults:
    """Model evaluation and benchmarks."""

    benchmark_results: dict[str, float] = field(default_factory=dict)
    evaluation_methodology: str = ""
    test_data_description: str = ""
    fairness_evaluation: dict[str, float] = field(default_factory=dict)
    safety_evaluation: dict[str, Any] = field(default_factory=dict)
    robustness_evaluation: dict[str, float] = field(default_factory=dict)


@dataclass
class RisksEthics:
    """Risks and ethical considerations."""

    identified_risks: list[str] = field(default_factory=list)
    bias_analysis: str = ""
    mitigation_measures: list[str] = field(default_factory=list)
    ethical_considerations: list[str] = field(default_factory=list)
    dual_use_risks: list[str] = field(default_factory=list)
    prohibited_uses: list[str] = field(default_factory=list)


@dataclass
class TechnicalSpecifications:
    """Technical specifications."""

    architecture: str = ""
    parameter_count: str = ""
    context_length: int | None = None
    input_format: str = ""
    output_format: str = ""
    api_specification: str = ""
    hardware_requirements: str = ""
    inference_latency: str = ""
    supported_languages: list[str] = field(default_factory=list)


@dataclass
class CopyrightCompliance:
    """EU AI Act copyright compliance information."""

    training_data_copyright_policy: str = ""
    content_filtering_mechanisms: str = ""
    opt_out_mechanisms: str = ""
    machine_readable_summary_location: str = ""


@dataclass
class ModelCard:
    """Complete GPAI model card."""

    identification: ModelIdentification
    training: TrainingInformation
    capabilities: CapabilitiesLimitations
    evaluation: EvaluationResults
    risks: RisksEthics
    technical: TechnicalSpecifications
    copyright: CopyrightCompliance
    card_version: str = "1.0"
    created_date: datetime = field(default_factory=datetime.utcnow)
    last_updated: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "card_version": self.card_version,
            "created_date": self.created_date.isoformat(),
            "last_updated": self.last_updated.isoformat(),
            "identification": {
                "model_name": self.identification.model_name,
                "version": self.identification.version,
                "provider_name": self.identification.provider_name,
                "provider_address": self.identification.provider_address,
                "release_date": self.identification.release_date,
                "model_type": self.identification.model_type,
                "modalities": self.identification.modalities,
                "license_type": self.identification.license_type,
                "contact_email": self.identification.contact_email,
            },
            "training": {
                "training_data_description": self.training.training_data_description,
                "data_sources": self.training.data_sources,
                "data_preprocessing": self.training.data_preprocessing,
                "training_methodology": self.training.training_methodology,
                "compute_resources": self.training.compute_resources,
                "training_duration": self.training.training_duration,
                "energy_consumption": self.training.energy_consumption,
                "carbon_footprint": self.training.carbon_footprint,
            },
            "capabilities": {
                "primary_capabilities": self.capabilities.primary_capabilities,
                "intended_use_cases": self.capabilities.intended_use_cases,
                "out_of_scope_uses": self.capabilities.out_of_scope_uses,
                "known_limitations": self.capabilities.known_limitations,
                "failure_modes": self.capabilities.failure_modes,
            },
            "evaluation": {
                "benchmark_results": self.evaluation.benchmark_results,
                "evaluation_methodology": self.evaluation.evaluation_methodology,
                "fairness_evaluation": self.evaluation.fairness_evaluation,
                "safety_evaluation": self.evaluation.safety_evaluation,
            },
            "risks": {
                "identified_risks": self.risks.identified_risks,
                "bias_analysis": self.risks.bias_analysis,
                "mitigation_measures": self.risks.mitigation_measures,
                "ethical_considerations": self.risks.ethical_considerations,
                "prohibited_uses": self.risks.prohibited_uses,
            },
            "technical": {
                "architecture": self.technical.architecture,
                "parameter_count": self.technical.parameter_count,
                "context_length": self.technical.context_length,
                "input_format": self.technical.input_format,
                "output_format": self.technical.output_format,
                "supported_languages": self.technical.supported_languages,
            },
            "copyright": {
                "training_data_copyright_policy": self.copyright.training_data_copyright_policy,
                "content_filtering_mechanisms": self.copyright.content_filtering_mechanisms,
                "opt_out_mechanisms": self.copyright.opt_out_mechanisms,
                "machine_readable_summary_location": self.copyright.machine_readable_summary_location,
            },
        }


class ModelCardGenerator:
    """
    Generator for EU AI Act compliant GPAI model cards.

    Example:
        generator = ModelCardGenerator()

        card = generator.create_model_card(
            model_name="MyLLM",
            version="1.0",
            provider_name="Acme AI",
            provider_address="123 AI Street",
            model_type="Large Language Model",
            release_date="2025-01-01"
        )

        generator.export_json(card, "model_card.json")
    """

    def create_model_card(
        self,
        model_name: str,
        version: str,
        provider_name: str,
        provider_address: str,
        model_type: str,
        release_date: str,
        **kwargs: Any,
    ) -> ModelCard:
        """
        Create a new model card.

        Args:
            model_name: Name of the model
            version: Model version
            provider_name: Provider/developer name
            provider_address: Provider address
            model_type: Type of model
            release_date: Release date

        Returns:
            ModelCard instance
        """
        identification = ModelIdentification(
            model_name=model_name,
            version=version,
            provider_name=provider_name,
            provider_address=provider_address,
            release_date=release_date,
            model_type=model_type,
            modalities=kwargs.get("modalities", ["text"]),
            license_type=kwargs.get("license_type", ""),
            contact_email=kwargs.get("contact_email", ""),
        )

        training = TrainingInformation(
            training_data_description=kwargs.get("training_data_description", ""),
            data_sources=kwargs.get("data_sources", []),
            training_methodology=kwargs.get("training_methodology", ""),
            compute_resources=kwargs.get("compute_resources", ""),
            energy_consumption=kwargs.get("energy_consumption", ""),
            carbon_footprint=kwargs.get("carbon_footprint", ""),
        )

        capabilities = CapabilitiesLimitations(
            primary_capabilities=kwargs.get("primary_capabilities", []),
            intended_use_cases=kwargs.get("intended_use_cases", []),
            out_of_scope_uses=kwargs.get("out_of_scope_uses", []),
            known_limitations=kwargs.get("known_limitations", []),
        )

        evaluation = EvaluationResults(
            benchmark_results=kwargs.get("benchmark_results", {}),
            evaluation_methodology=kwargs.get("evaluation_methodology", ""),
            fairness_evaluation=kwargs.get("fairness_evaluation", {}),
            safety_evaluation=kwargs.get("safety_evaluation", {}),
        )

        risks = RisksEthics(
            identified_risks=kwargs.get("identified_risks", []),
            bias_analysis=kwargs.get("bias_analysis", ""),
            mitigation_measures=kwargs.get("mitigation_measures", []),
            ethical_considerations=kwargs.get("ethical_considerations", []),
            prohibited_uses=kwargs.get("prohibited_uses", []),
        )

        technical = TechnicalSpecifications(
            architecture=kwargs.get("architecture", ""),
            parameter_count=kwargs.get("parameter_count", ""),
            context_length=kwargs.get("context_length"),
            input_format=kwargs.get("input_format", ""),
            output_format=kwargs.get("output_format", ""),
            supported_languages=kwargs.get("supported_languages", []),
        )

        copyright_info = CopyrightCompliance(
            training_data_copyright_policy=kwargs.get("copyright_policy", ""),
            content_filtering_mechanisms=kwargs.get("content_filtering", ""),
            opt_out_mechanisms=kwargs.get("opt_out_mechanisms", ""),
            machine_readable_summary_location=kwargs.get("summary_location", ""),
        )

        return ModelCard(
            identification=identification,
            training=training,
            capabilities=capabilities,
            evaluation=evaluation,
            risks=risks,
            technical=technical,
            copyright=copyright_info,
        )

    def validate_completeness(
        self,
        card: ModelCard,
    ) -> dict[str, list[str]]:
        """
        Validate model card completeness for EU AI Act compliance.

        Returns:
            Dictionary of missing/incomplete fields
        """
        issues = {
            "required_missing": [],
            "recommended_missing": [],
            "warnings": [],
        }

        # Required fields
        if not card.identification.model_name:
            issues["required_missing"].append("identification.model_name")
        if not card.identification.provider_name:
            issues["required_missing"].append("identification.provider_name")
        if not card.identification.provider_address:
            issues["required_missing"].append("identification.provider_address")

        # Training data transparency (Article 53)
        if not card.training.training_data_description:
            issues["required_missing"].append("training.training_data_description")

        # Copyright compliance (Article 53)
        if not card.copyright.training_data_copyright_policy:
            issues["required_missing"].append("copyright.training_data_copyright_policy")
        if not card.copyright.machine_readable_summary_location:
            issues["recommended_missing"].append("copyright.machine_readable_summary_location")

        # Capabilities and limitations
        if not card.capabilities.primary_capabilities:
            issues["recommended_missing"].append("capabilities.primary_capabilities")
        if not card.capabilities.known_limitations:
            issues["recommended_missing"].append("capabilities.known_limitations")

        # Evaluation
        if not card.evaluation.benchmark_results:
            issues["recommended_missing"].append("evaluation.benchmark_results")
        if not card.evaluation.safety_evaluation:
            issues["recommended_missing"].append("evaluation.safety_evaluation")

        # Risks
        if not card.risks.identified_risks:
            issues["recommended_missing"].append("risks.identified_risks")

        return issues

    def export_json(
        self,
        card: ModelCard,
        filepath: str,
    ) -> bool:
        """Export model card to JSON."""
        try:
            with open(filepath, "w") as f:
                json.dump(card.to_dict(), f, indent=2)
            return True
        except Exception:
            return False

    def export_markdown(
        self,
        card: ModelCard,
        filepath: str,
    ) -> bool:
        """Export model card to Markdown."""
        try:
            md = self._generate_markdown(card)
            with open(filepath, "w") as f:
                f.write(md)
            return True
        except Exception:
            return False

    def _generate_markdown(self, card: ModelCard) -> str:
        """Generate markdown representation."""
        md = f"""# Model Card: {card.identification.model_name}

**Version:** {card.identification.version}
**Provider:** {card.identification.provider_name}
**Release Date:** {card.identification.release_date}
**Model Type:** {card.identification.model_type}

---

## Model Identification

- **Provider Address:** {card.identification.provider_address}
- **License:** {card.identification.license_type or "Not specified"}
- **Modalities:** {", ".join(card.identification.modalities) or "Not specified"}

## Training Information

{card.training.training_data_description or "Training data description not provided."}

**Data Sources:**
{self._list_to_md(card.training.data_sources)}

**Compute Resources:** {card.training.compute_resources or "Not specified"}

**Environmental Impact:**
- Energy Consumption: {card.training.energy_consumption or "Not specified"}
- Carbon Footprint: {card.training.carbon_footprint or "Not specified"}

## Capabilities

**Primary Capabilities:**
{self._list_to_md(card.capabilities.primary_capabilities)}

**Intended Use Cases:**
{self._list_to_md(card.capabilities.intended_use_cases)}

**Out of Scope Uses:**
{self._list_to_md(card.capabilities.out_of_scope_uses)}

## Known Limitations

{self._list_to_md(card.capabilities.known_limitations)}

## Evaluation Results

**Benchmark Results:**
{self._dict_to_md(card.evaluation.benchmark_results)}

**Safety Evaluation:**
{self._dict_to_md(card.evaluation.safety_evaluation)}

## Risks and Ethics

**Identified Risks:**
{self._list_to_md(card.risks.identified_risks)}

**Prohibited Uses:**
{self._list_to_md(card.risks.prohibited_uses)}

**Mitigation Measures:**
{self._list_to_md(card.risks.mitigation_measures)}

## Technical Specifications

- **Architecture:** {card.technical.architecture or "Not specified"}
- **Parameters:** {card.technical.parameter_count or "Not specified"}
- **Context Length:** {card.technical.context_length or "Not specified"}
- **Supported Languages:** {", ".join(card.technical.supported_languages) or "Not specified"}

## Copyright Compliance

{card.copyright.training_data_copyright_policy or "Copyright policy not specified."}

**Opt-out Mechanisms:** {card.copyright.opt_out_mechanisms or "Not specified"}

---

*Model Card Version: {card.card_version}*
*Last Updated: {card.last_updated.isoformat()}*
"""
        return md

    def _list_to_md(self, items: list) -> str:
        """Convert list to markdown."""
        if not items:
            return "- None specified\n"
        return "\n".join(f"- {item}" for item in items)

    def _dict_to_md(self, d: dict) -> str:
        """Convert dict to markdown."""
        if not d:
            return "- None specified\n"
        return "\n".join(f"- **{k}:** {v}" for k, v in d.items())
