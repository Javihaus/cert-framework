"""Test trajectory module imports."""

import pytest


def test_import_trajectory_module():
    """Test trajectory module can be imported."""
    import cert.trajectory
    assert cert.trajectory.__version__ is not None


def test_import_trajectory_types():
    """Test trajectory types can be imported."""
    from cert.trajectory import (
        ReasoningMetrics,
        TrajectoryAnalysis,
        TrajectoryConfig
    )

    assert ReasoningMetrics is not None
    assert TrajectoryAnalysis is not None
    assert TrajectoryConfig is not None


def test_import_trajectory_monitor():
    """Test trajectory monitor can be imported."""
    from cert.trajectory import ReasoningTrajectoryMonitor

    assert ReasoningTrajectoryMonitor is not None


def test_import_trajectory_visualizer():
    """Test trajectory visualizer can be imported (requires matplotlib)."""
    pytest.importorskip("matplotlib")
    from cert.trajectory import HamiltonianVisualizer

    assert HamiltonianVisualizer is not None


def test_import_trajectory_analyzer():
    """Test trajectory analyzer can be imported."""
    from cert.trajectory import CERTTrajectoryAnalyzer

    assert CERTTrajectoryAnalyzer is not None


def test_import_trajectory_utils():
    """Test trajectory utils can be imported."""
    from cert.trajectory import load_model_for_monitoring, unload_model

    assert load_model_for_monitoring is not None
    assert unload_model is not None


def test_import_from_cert_package():
    """Test trajectory can be imported from main cert package."""
    from cert import (
        analyze_trajectory,
        TrajectoryConfig,
        TrajectoryAnalysis,
        load_model_for_monitoring,
        unload_model
    )

    assert analyze_trajectory is not None
    assert TrajectoryConfig is not None
    assert TrajectoryAnalysis is not None
    assert load_model_for_monitoring is not None
    assert unload_model is not None


def test_import_visualizer_from_cert_package():
    """Test HamiltonianVisualizer can be imported from main cert package (requires matplotlib)."""
    pytest.importorskip("matplotlib")
    from cert import HamiltonianVisualizer

    assert HamiltonianVisualizer is not None


def test_trajectory_config_defaults():
    """Test TrajectoryConfig has correct defaults."""
    from cert.trajectory import TrajectoryConfig

    config = TrajectoryConfig()

    assert config.perplexity_threshold == 50.0
    assert config.entropy_threshold == 2.5
    assert config.surprise_threshold == 10.0
    assert config.max_new_tokens == 150
    assert config.temperature == 0.7
    assert config.top_k == 10
    assert config.surprise_probability_threshold == 0.1


def test_trajectory_config_custom():
    """Test TrajectoryConfig accepts custom values."""
    from cert.trajectory import TrajectoryConfig

    config = TrajectoryConfig(
        perplexity_threshold=40.0,
        entropy_threshold=2.0,
        surprise_threshold=8.0,
        max_new_tokens=200,
        temperature=0.5
    )

    assert config.perplexity_threshold == 40.0
    assert config.entropy_threshold == 2.0
    assert config.surprise_threshold == 8.0
    assert config.max_new_tokens == 200
    assert config.temperature == 0.5


def test_reasoning_metrics_creation():
    """Test ReasoningMetrics can be created."""
    from cert.trajectory import ReasoningMetrics

    metrics = ReasoningMetrics(
        step=0,
        token="test",
        perplexity=10.5,
        top_k_entropy=1.8,
        logit_gap=0.3,
        cumulative_surprise=2.5
    )

    assert metrics.step == 0
    assert metrics.token == "test"
    assert metrics.perplexity == 10.5
    assert metrics.top_k_entropy == 1.8
    assert metrics.logit_gap == 0.3
    assert metrics.cumulative_surprise == 2.5


def test_reasoning_metrics_to_dict():
    """Test ReasoningMetrics can be converted to dict."""
    from cert.trajectory import ReasoningMetrics

    metrics = ReasoningMetrics(
        step=0,
        token="test",
        perplexity=10.5,
        top_k_entropy=1.8,
        logit_gap=0.3,
        cumulative_surprise=2.5
    )

    metrics_dict = metrics.to_dict()

    assert isinstance(metrics_dict, dict)
    assert metrics_dict["step"] == 0
    assert metrics_dict["token"] == "test"
    assert metrics_dict["perplexity"] == 10.5
