"""Test that all core modules can be imported.

These are the most basic tests - they just verify the package structure
is correct and imports don't fail.
"""

from conftest import requires_evaluation


def test_import_cert():
    """Test main cert package imports."""
    import cert

    assert cert.__version__ is not None


@requires_evaluation
def test_import_public_api():
    """Test public API imports from cert package."""
    from cert import PRESETS, Preset, export_report, measure, monitor

    assert measure is not None
    assert monitor is not None
    assert Preset is not None
    assert PRESETS is not None
    assert export_report is not None


@requires_evaluation
def test_import_measure_module():
    """Test measure module imports."""
    from cert.measure import measure
    from cert.measure.types import MeasurementResult

    assert measure is not None
    assert MeasurementResult is not None


@requires_evaluation
def test_import_monitor_module():
    """Test monitor module imports."""
    from cert.monitor import monitor

    assert monitor is not None


def test_import_utils_module():
    """Test utils module imports."""
    from cert.utils import PRESETS, AuditLogger, Preset, export_report, get_preset

    assert Preset is not None
    assert PRESETS is not None
    assert get_preset is not None
    assert export_report is not None
    assert AuditLogger is not None


def test_presets_available():
    """Test that all expected presets are available."""
    from cert import PRESETS

    expected_presets = ["healthcare", "financial", "legal", "general"]

    for preset in expected_presets:
        assert preset in PRESETS, f"Preset '{preset}' not found in PRESETS"
        assert "accuracy_threshold" in PRESETS[preset]
        assert "hallucination_tolerance" in PRESETS[preset]
