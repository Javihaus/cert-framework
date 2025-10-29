"""Tests for enhanced industry presets with compliance mapping."""

from cert.utils.presets import (
    IndustryPreset,
    ComplianceRequirement,
    INDUSTRY_PRESETS,
    get_industry_preset,
    Preset,
)


def test_compliance_requirement_creation():
    """Test creating a compliance requirement."""
    req = ComplianceRequirement(
        article="Article 15.1",
        description="High level of accuracy",
        metric="accuracy",
        threshold=0.85,
        severity="mandatory",
    )

    assert req.article == "Article 15.1"
    assert req.description == "High level of accuracy"
    assert req.metric == "accuracy"
    assert req.threshold == 0.85
    assert req.severity == "mandatory"


def test_industry_preset_creation():
    """Test creating an industry preset."""
    preset = IndustryPreset(
        name="test",
        description="Test preset",
        measure_config={"threshold": 0.8},
        compliance_requirements=[
            ComplianceRequirement(
                article="Article 15.1",
                description="Test requirement",
                metric="accuracy",
                threshold=0.8,
                severity="mandatory",
            )
        ],
        risk_level="high",
    )

    assert preset.name == "test"
    assert preset.risk_level == "high"
    assert len(preset.compliance_requirements) == 1


def test_industry_presets_exist():
    """Test that all industry presets exist."""
    assert "healthcare" in INDUSTRY_PRESETS
    assert "financial" in INDUSTRY_PRESETS
    assert "legal" in INDUSTRY_PRESETS
    assert "general" in INDUSTRY_PRESETS


def test_healthcare_preset():
    """Test healthcare preset configuration."""
    preset = INDUSTRY_PRESETS["healthcare"]

    assert preset.name == "healthcare"
    assert preset.risk_level == "high"
    assert len(preset.compliance_requirements) >= 1

    # Check has accuracy requirement
    has_accuracy = any(req.article == "Article 15.1" for req in preset.compliance_requirements)
    assert has_accuracy


def test_financial_preset():
    """Test financial preset configuration."""
    preset = INDUSTRY_PRESETS["financial"]

    assert preset.name == "financial"
    assert preset.risk_level == "high"
    assert len(preset.compliance_requirements) >= 1


def test_legal_preset():
    """Test legal preset configuration."""
    preset = INDUSTRY_PRESETS["legal"]

    assert preset.name == "legal"
    assert preset.risk_level == "high"
    assert len(preset.compliance_requirements) >= 1


def test_general_preset():
    """Test general preset configuration."""
    preset = INDUSTRY_PRESETS["general"]

    assert preset.name == "general"
    assert preset.risk_level == "minimal"
    assert len(preset.compliance_requirements) >= 1


def test_get_industry_preset_by_string():
    """Test getting preset by string name."""
    preset = get_industry_preset("healthcare")

    assert preset.name == "healthcare"
    assert isinstance(preset, IndustryPreset)


def test_get_industry_preset_by_enum():
    """Test getting preset by Preset enum."""
    preset = get_industry_preset(Preset.FINANCIAL)

    assert preset.name == "financial"
    assert isinstance(preset, IndustryPreset)


def test_get_industry_preset_invalid():
    """Test that invalid preset name raises error."""
    try:
        get_industry_preset("invalid_preset")
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "Invalid preset" in str(e)
        assert "valid presets" in str(e).lower()


def test_preset_to_dict():
    """Test converting preset to dictionary."""
    preset = INDUSTRY_PRESETS["healthcare"]
    preset_dict = preset.to_dict()

    assert preset_dict["name"] == "healthcare"
    assert "measure_config" in preset_dict
    assert "compliance_requirements" in preset_dict
    assert "risk_level" in preset_dict

    # Check compliance requirements format
    assert len(preset_dict["compliance_requirements"]) >= 1
    req = preset_dict["compliance_requirements"][0]
    assert "article" in req
    assert "description" in req
    assert "metric" in req
    assert "threshold" in req
    assert "severity" in req


def test_check_compliance_with_mock_result():
    """Test checking compliance with a mock measurement result."""

    class MockMeasurementResult:
        def __init__(self):
            self.confidence = 0.90
            self.semantic_score = 0.85
            self.nli_score = 0.88
            self.ungrounded_terms = []

    preset = INDUSTRY_PRESETS["financial"]
    result = MockMeasurementResult()

    compliance = preset.check_compliance(result)

    assert isinstance(compliance, dict)
    assert "Article 15.1" in compliance
    assert compliance["Article 15.1"] is True  # Meets 0.80 threshold


def test_check_compliance_failure():
    """Test compliance check when requirements not met."""

    class MockMeasurementResult:
        def __init__(self):
            self.confidence = 0.50  # Below threshold
            self.semantic_score = 0.45
            self.nli_score = 0.40
            self.ungrounded_terms = []

    preset = INDUSTRY_PRESETS["healthcare"]  # Strict requirements
    result = MockMeasurementResult()

    compliance = preset.check_compliance(result)

    # Should fail accuracy requirement
    assert "Article 15.1" in compliance
    assert compliance["Article 15.1"] is False


def test_check_compliance_grounding_requirement():
    """Test compliance check for grounding requirement."""

    class MockMeasurementResult:
        def __init__(self):
            self.confidence = 0.90
            self.semantic_score = 0.85
            self.nli_score = 0.88
            self.ungrounded_terms = ["term1", "term2"]  # Has ungrounded terms

    preset = INDUSTRY_PRESETS["healthcare"]  # Has grounding requirement
    result = MockMeasurementResult()

    compliance = preset.check_compliance(result)

    # Should fail grounding requirement (Article 15.4)
    if "Article 15.4" in compliance:
        assert compliance["Article 15.4"] is False


def test_all_presets_have_measure_config():
    """Test that all presets have measure configuration."""
    for name, preset in INDUSTRY_PRESETS.items():
        assert "threshold" in preset.measure_config, f"{name} missing threshold"
        assert "use_semantic" in preset.measure_config
        assert "use_nli" in preset.measure_config
        assert "use_grounding" in preset.measure_config


def test_all_presets_have_compliance_requirements():
    """Test that all presets have compliance requirements."""
    for name, preset in INDUSTRY_PRESETS.items():
        assert len(preset.compliance_requirements) > 0, f"{name} has no compliance requirements"

        # Check each requirement is well-formed
        for req in preset.compliance_requirements:
            assert req.article, f"{name} requirement missing article"
            assert req.description, f"{name} requirement missing description"
            assert req.metric in [
                "accuracy",
                "grounding",
                "nli",
                "semantic",
            ], f"{name} has invalid metric: {req.metric}"
            assert 0.0 <= req.threshold <= 1.0, f"{name} has invalid threshold"
            assert req.severity in [
                "mandatory",
                "recommended",
            ], f"{name} has invalid severity"


def test_high_risk_presets_stricter_than_general():
    """Test that high-risk presets have stricter thresholds."""
    general = INDUSTRY_PRESETS["general"]
    healthcare = INDUSTRY_PRESETS["healthcare"]

    general_threshold = general.measure_config["threshold"]
    healthcare_threshold = healthcare.measure_config["threshold"]

    # Healthcare should be stricter (higher threshold)
    assert healthcare_threshold >= general_threshold


def test_preset_descriptions_meaningful():
    """Test that all presets have meaningful descriptions."""
    for name, preset in INDUSTRY_PRESETS.items():
        assert len(preset.description) > 10, f"{name} has too short description"
        assert "AI" in preset.description or "ai" in preset.description.lower()
