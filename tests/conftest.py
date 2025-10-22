"""Pytest configuration and shared fixtures."""

import pytest


@pytest.fixture(scope="session")
def sample_responses():
    """Sample responses for testing."""
    return [
        "The key factors are planning and execution.",
        "Planning and execution are the key factors.",
        "Key factors include planning and execution.",
    ]


@pytest.fixture(scope="session")
def sample_latencies():
    """Sample latency measurements for testing."""
    return [0.5, 0.6, 0.55, 0.58, 0.52, 0.61, 0.54, 0.59, 0.56, 0.57]
