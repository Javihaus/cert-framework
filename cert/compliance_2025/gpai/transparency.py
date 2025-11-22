"""
Transparency Requirements for GPAI and AI Systems

Implements EU AI Act transparency requirements including
AI disclosure, content labeling, and information provision.
"""

import json
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any


class ContentType(Enum):
    """Types of AI-generated content."""

    TEXT = "text"
    IMAGE = "image"
    AUDIO = "audio"
    VIDEO = "video"
    CODE = "code"
    SYNTHETIC_MEDIA = "synthetic_media"
    DEEPFAKE = "deepfake"


class TransparencyRequirementType(Enum):
    """Types of transparency requirements."""

    INTERACTION_DISCLOSURE = "interaction_disclosure"
    CONTENT_LABELING = "content_labeling"
    EMOTION_RECOGNITION_DISCLOSURE = "emotion_recognition_disclosure"
    BIOMETRIC_CATEGORIZATION_DISCLOSURE = "biometric_categorization_disclosure"
    DEEPFAKE_LABELING = "deepfake_labeling"
    PROVIDER_INFORMATION = "provider_information"


@dataclass
class TransparencyRequirement:
    """Individual transparency requirement."""

    requirement_type: TransparencyRequirementType
    description: str
    article_reference: str
    applicable: bool
    implementation: str = ""
    status: str = "not_implemented"  # "not_implemented", "partial", "implemented"


@dataclass
class ContentLabel:
    """Label for AI-generated content."""

    content_id: str
    content_type: ContentType
    generator_model: str
    generation_timestamp: datetime
    label_text: str
    machine_readable: bool = True
    watermark_applied: bool = False
    provenance_data: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "content_id": self.content_id,
            "content_type": self.content_type.value,
            "generator_model": self.generator_model,
            "generation_timestamp": self.generation_timestamp.isoformat(),
            "label_text": self.label_text,
            "machine_readable": self.machine_readable,
            "watermark_applied": self.watermark_applied,
            "provenance_data": self.provenance_data,
        }


class TransparencyRequirements:
    """
    Transparency requirements manager for EU AI Act compliance.

    Implements Article 50 transparency obligations for AI systems,
    including disclosure requirements and content labeling.

    Example:
        transparency = TransparencyRequirements()

        # Check requirements for a chatbot
        reqs = transparency.get_requirements(
            is_chatbot=True,
            generates_content=True,
            content_types=["text", "image"]
        )

        for req in reqs:
            print(f"[{req.status}] {req.description}")

        # Generate content label
        label = transparency.create_content_label(
            content_type=ContentType.IMAGE,
            generator_model="DALL-E 3",
            content_id="img_123"
        )
    """

    def __init__(self):
        """Initialize transparency requirements."""
        self._labels: list[ContentLabel] = []
        self._label_counter = 0

    def get_requirements(
        self,
        is_chatbot: bool = False,
        generates_content: bool = False,
        content_types: list[str] | None = None,
        uses_emotion_recognition: bool = False,
        uses_biometric_categorization: bool = False,
        generates_deepfakes: bool = False,
    ) -> list[TransparencyRequirement]:
        """
        Get applicable transparency requirements.

        Args:
            is_chatbot: System interacts with users via natural language
            generates_content: System generates synthetic content
            content_types: Types of content generated
            uses_emotion_recognition: System detects emotions
            uses_biometric_categorization: System categorizes biometric data
            generates_deepfakes: System creates synthetic media of real persons

        Returns:
            List of applicable TransparencyRequirement objects
        """
        requirements = []
        content_types = content_types or []

        # Article 50(1) - Chatbot disclosure
        if is_chatbot:
            requirements.append(
                TransparencyRequirement(
                    requirement_type=TransparencyRequirementType.INTERACTION_DISCLOSURE,
                    description="Inform users they are interacting with an AI system",
                    article_reference="Article 50(1)",
                    applicable=True,
                    implementation="Display clear notice that user is interacting with AI",
                )
            )

        # Article 50(2) - Emotion recognition disclosure
        if uses_emotion_recognition:
            requirements.append(
                TransparencyRequirement(
                    requirement_type=TransparencyRequirementType.EMOTION_RECOGNITION_DISCLOSURE,
                    description="Inform natural persons exposed to emotion recognition system",
                    article_reference="Article 50(2)",
                    applicable=True,
                    implementation="Provide clear notice before emotion recognition processing",
                )
            )

        # Article 50(3) - Biometric categorization disclosure
        if uses_biometric_categorization:
            requirements.append(
                TransparencyRequirement(
                    requirement_type=TransparencyRequirementType.BIOMETRIC_CATEGORIZATION_DISCLOSURE,
                    description="Inform natural persons exposed to biometric categorization",
                    article_reference="Article 50(3)",
                    applicable=True,
                    implementation="Provide clear notice before biometric categorization",
                )
            )

        # Article 50(4) - AI-generated content labeling
        if generates_content:
            requirements.append(
                TransparencyRequirement(
                    requirement_type=TransparencyRequirementType.CONTENT_LABELING,
                    description="Mark AI-generated content in machine-readable format",
                    article_reference="Article 50(4)",
                    applicable=True,
                    implementation="Apply machine-readable markers and visible labels to generated content",
                )
            )

            # Specific content type requirements
            for ct in content_types:
                if ct.lower() in ["image", "audio", "video"]:
                    requirements.append(
                        TransparencyRequirement(
                            requirement_type=TransparencyRequirementType.CONTENT_LABELING,
                            description=f"Apply watermarking or metadata to {ct} content",
                            article_reference="Article 50(4)",
                            applicable=True,
                            implementation=f"Embed provenance metadata in {ct} files",
                        )
                    )

        # Deep fake specific requirements
        if generates_deepfakes:
            requirements.append(
                TransparencyRequirement(
                    requirement_type=TransparencyRequirementType.DEEPFAKE_LABELING,
                    description="Clearly disclose that content is artificially generated (deep fake)",
                    article_reference="Article 50(4)(c)",
                    applicable=True,
                    implementation="Add visible 'AI Generated' label and embedded metadata",
                )
            )

        return requirements

    def create_content_label(
        self,
        content_type: ContentType,
        generator_model: str,
        content_id: str | None = None,
        apply_watermark: bool = False,
        custom_label: str | None = None,
        provenance_data: dict[str, Any] | None = None,
    ) -> ContentLabel:
        """
        Create a content label for AI-generated content.

        Args:
            content_type: Type of content
            generator_model: Model that generated the content
            content_id: Unique content identifier
            apply_watermark: Whether to apply watermark
            custom_label: Custom label text
            provenance_data: Additional provenance information

        Returns:
            ContentLabel instance
        """
        self._label_counter += 1
        if content_id is None:
            content_id = f"ai_content_{int(datetime.utcnow().timestamp())}_{self._label_counter}"

        # Generate standard label text
        if custom_label:
            label_text = custom_label
        else:
            label_text = f"AI Generated Content - Created by {generator_model}"

        label = ContentLabel(
            content_id=content_id,
            content_type=content_type,
            generator_model=generator_model,
            generation_timestamp=datetime.utcnow(),
            label_text=label_text,
            machine_readable=True,
            watermark_applied=apply_watermark,
            provenance_data=provenance_data or {},
        )

        self._labels.append(label)
        return label

    def generate_disclosure_text(
        self,
        system_type: str = "AI assistant",
        capabilities: list[str] | None = None,
        limitations: list[str] | None = None,
    ) -> str:
        """
        Generate standard disclosure text for AI systems.

        Args:
            system_type: Type of AI system
            capabilities: System capabilities to disclose
            limitations: System limitations to disclose

        Returns:
            Disclosure text string
        """
        disclosure = f"""
AI System Disclosure

You are interacting with an {system_type}. This system uses artificial intelligence
to process and respond to your inputs.
"""

        if capabilities:
            disclosure += "\nCapabilities:\n"
            for cap in capabilities:
                disclosure += f"• {cap}\n"

        if limitations:
            disclosure += "\nLimitations:\n"
            for lim in limitations:
                disclosure += f"• {lim}\n"

        disclosure += """
Important: This AI system may make errors. For critical decisions, please verify
information from authoritative sources.
"""
        return disclosure.strip()

    def get_machine_readable_metadata(
        self,
        label: ContentLabel,
    ) -> dict[str, Any]:
        """
        Get machine-readable metadata for content labeling.

        Args:
            label: ContentLabel to convert

        Returns:
            Dictionary with C2PA-compatible metadata structure
        """
        return {
            "ai_generated": True,
            "generator": {
                "model": label.generator_model,
                "timestamp": label.generation_timestamp.isoformat(),
            },
            "content": {
                "id": label.content_id,
                "type": label.content_type.value,
            },
            "provenance": {
                "version": "1.0",
                "standard": "EU-AI-Act-2025",
                "watermarked": label.watermark_applied,
                **label.provenance_data,
            },
        }

    def export_labels(
        self,
        filepath: str,
    ) -> bool:
        """Export all content labels to JSON."""
        try:
            data = [label.to_dict() for label in self._labels]
            with open(filepath, "w") as f:
                json.dump(data, f, indent=2)
            return True
        except Exception:
            return False

    def validate_compliance(
        self,
        requirements: list[TransparencyRequirement],
    ) -> dict[str, Any]:
        """
        Validate compliance status of requirements.

        Args:
            requirements: List of requirements to validate

        Returns:
            Compliance summary dictionary
        """
        total = len(requirements)
        implemented = sum(1 for r in requirements if r.status == "implemented")
        partial = sum(1 for r in requirements if r.status == "partial")
        not_implemented = sum(1 for r in requirements if r.status == "not_implemented")

        return {
            "total_requirements": total,
            "implemented": implemented,
            "partial": partial,
            "not_implemented": not_implemented,
            "compliance_rate": implemented / total if total > 0 else 0,
            "gaps": [r.description for r in requirements if r.status != "implemented"],
        }
