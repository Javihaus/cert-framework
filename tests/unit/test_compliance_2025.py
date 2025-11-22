"""
Unit tests for the compliance_2025 module.
"""

import pytest


class TestAIActRiskClassifier:
    """Tests for AIActRiskClassifier."""

    def test_import(self):
        """Test that the module can be imported."""
        from cert.compliance_2025 import AIActRiskClassifier, RiskLevel
        assert AIActRiskClassifier is not None
        assert RiskLevel is not None

    def test_classify_employment_domain(self):
        """Test classification of employment domain system."""
        from cert.compliance_2025 import AIActRiskClassifier, RiskLevel

        classifier = AIActRiskClassifier()

        assessment = classifier.classify(
            system_name="HR Screening AI",
            description="AI system for screening job applications and CVs",
            domain="employment",
            keywords=["recruitment", "cv screening", "hiring"],
        )

        assert assessment.risk_level == RiskLevel.HIGH
        assert len(assessment.requirements) > 0

    def test_classify_minimal_risk(self):
        """Test classification of minimal risk system."""
        from cert.compliance_2025 import AIActRiskClassifier, RiskLevel

        classifier = AIActRiskClassifier()

        assessment = classifier.classify(
            system_name="Spam Filter",
            description="Email spam classification system",
            domain="general",
            keywords=["spam", "email", "filter"],
        )

        assert assessment.risk_level in [RiskLevel.MINIMAL, RiskLevel.LIMITED]

    def test_classify_chatbot(self):
        """Test classification of chatbot system."""
        from cert.compliance_2025 import AIActRiskClassifier, RiskLevel

        classifier = AIActRiskClassifier()

        assessment = classifier.classify(
            system_name="Customer Service Bot",
            description="Conversational AI assistant for customer support",
            domain="general",
            keywords=["chatbot", "assistant", "conversational"],
        )

        assert assessment.risk_level == RiskLevel.LIMITED
        assert any("transparency" in req.lower() for req in assessment.requirements)


class TestHighRiskRequirements:
    """Tests for HighRiskRequirements."""

    def test_import(self):
        """Test that the module can be imported."""
        from cert.compliance_2025.high_risk import HighRiskRequirements
        assert HighRiskRequirements is not None

    def test_assess_compliance(self):
        """Test compliance assessment."""
        from cert.compliance_2025.high_risk import HighRiskRequirements

        checker = HighRiskRequirements()

        metadata = {
            "risk_management_documented": True,
            "data_governance_practices": True,
            "documentation_exists": True,
            "logging_enabled": True,
            "human_oversight_design": True,
            "accuracy_measured": True,
        }

        report = checker.assess_compliance("Test System", metadata)

        assert report is not None
        assert report.compliance_score > 0


class TestHighRiskDocumentation:
    """Tests for HighRiskDocumentation."""

    def test_import(self):
        """Test that the module can be imported."""
        from cert.compliance_2025.high_risk import HighRiskDocumentation
        assert HighRiskDocumentation is not None

    def test_create_documentation(self):
        """Test creating technical documentation."""
        from cert.compliance_2025.high_risk import HighRiskDocumentation

        generator = HighRiskDocumentation()

        doc = generator.create_documentation(
            name="Test AI System",
            version="1.0",
            intended_purpose="Test purpose",
            provider_name="Test Provider",
            provider_address="123 Test Street",
        )

        assert doc is not None
        assert doc.system_description.name == "Test AI System"
        assert doc.system_description.version == "1.0"


class TestHumanOversight:
    """Tests for HumanOversight."""

    def test_import(self):
        """Test that the module can be imported."""
        from cert.compliance_2025.high_risk import HumanOversight, requires_human_oversight
        assert HumanOversight is not None
        assert requires_human_oversight is not None

    def test_requires_review(self):
        """Test human review requirement check."""
        from cert.compliance_2025.high_risk import HumanOversight, OversightConfig

        config = OversightConfig(confidence_threshold=0.8)
        oversight = HumanOversight(config=config)

        # Low confidence should require review
        assert oversight.requires_review(confidence=0.5) is True

        # High confidence should not require review
        assert oversight.requires_review(confidence=0.9) is False


class TestModelCard:
    """Tests for ModelCard generation."""

    def test_import(self):
        """Test that the module can be imported."""
        from cert.compliance_2025.gpai import ModelCard, ModelCardGenerator
        assert ModelCard is not None
        assert ModelCardGenerator is not None

    def test_create_model_card(self):
        """Test creating a model card."""
        from cert.compliance_2025.gpai import ModelCardGenerator

        generator = ModelCardGenerator()

        card = generator.create_model_card(
            model_name="TestLLM",
            version="1.0",
            provider_name="Test Provider",
            provider_address="123 Test Street",
            model_type="Large Language Model",
            release_date="2025-01-01",
        )

        assert card is not None
        assert card.identification.model_name == "TestLLM"


class TestSystemicRiskAssessment:
    """Tests for SystemicRiskAssessment."""

    def test_import(self):
        """Test that the module can be imported."""
        from cert.compliance_2025.gpai import SystemicRiskAssessment
        assert SystemicRiskAssessment is not None

    def test_assess_low_compute(self):
        """Test assessment with low compute."""
        from cert.compliance_2025.gpai import SystemicRiskAssessment

        assessor = SystemicRiskAssessment()

        result = assessor.assess(
            model_name="Small Model",
            compute_flops=1e20,  # Below threshold
        )

        assert result.is_systemic_risk_model is False

    def test_assess_high_compute(self):
        """Test assessment with high compute (systemic risk)."""
        from cert.compliance_2025.gpai import SystemicRiskAssessment

        assessor = SystemicRiskAssessment()

        result = assessor.assess(
            model_name="Large Model",
            compute_flops=5e25,  # Above threshold
        )

        assert result.is_systemic_risk_model is True
        assert len(result.required_measures) > 0


class TestConformityAssessment:
    """Tests for ConformityAssessment."""

    def test_import(self):
        """Test that the module can be imported."""
        from cert.compliance_2025.audit import ConformityAssessment
        assert ConformityAssessment is not None

    def test_assess(self):
        """Test conformity assessment."""
        from cert.compliance_2025.audit import ConformityAssessment

        assessment = ConformityAssessment()

        evidence = {
            "risk_management": ["risk_doc.pdf"],
            "data_governance": ["data_policy.pdf"],
            "documentation": ["tech_doc.pdf"],
            "logging": ["log_config.json"],
        }

        report = assessment.assess(
            system_name="Test System",
            provider_name="Test Provider",
            evidence=evidence,
        )

        assert report is not None
        assert report.system_name == "Test System"


class TestEUDatabaseRegistration:
    """Tests for EUDatabaseRegistration."""

    def test_import(self):
        """Test that the module can be imported."""
        from cert.compliance_2025.audit import EUDatabaseRegistration
        assert EUDatabaseRegistration is not None

    def test_create_entry(self):
        """Test creating a registration entry."""
        from cert.compliance_2025.audit import EUDatabaseRegistration

        registry = EUDatabaseRegistration()

        entry = registry.create_entry(
            provider_name="Test Provider",
            provider_address="123 Test St",
            provider_country="DE",
            provider_contact_email="test@test.com",
            system_name="Test System",
            system_version="1.0",
            system_description="A test AI system for demonstration purposes",
            intended_purpose="Testing and demonstration",
            risk_category="employment",
        )

        assert entry is not None
        assert entry.system_name == "Test System"
        assert entry.registration_id is not None


class TestTransparencyRequirements:
    """Tests for TransparencyRequirements."""

    def test_import(self):
        """Test that the module can be imported."""
        from cert.compliance_2025.gpai import TransparencyRequirements
        assert TransparencyRequirements is not None

    def test_get_requirements_chatbot(self):
        """Test getting requirements for a chatbot."""
        from cert.compliance_2025.gpai import TransparencyRequirements

        transparency = TransparencyRequirements()

        requirements = transparency.get_requirements(
            is_chatbot=True,
            generates_content=True,
        )

        assert len(requirements) > 0
        # Should include interaction disclosure
        assert any(r.requirement_type.value == "interaction_disclosure" for r in requirements)
