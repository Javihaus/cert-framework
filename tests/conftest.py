"""Pytest configuration for CERT Framework tests."""

import pytest

# Check if evaluation dependencies are available
try:
    from sentence_transformers import SentenceTransformer  # noqa: F401

    EVALUATION_DEPS_AVAILABLE = True
except ImportError:
    EVALUATION_DEPS_AVAILABLE = False

# Check if trajectory dependencies are available
try:
    import torch  # noqa: F401

    TRAJECTORY_DEPS_AVAILABLE = True
except ImportError:
    TRAJECTORY_DEPS_AVAILABLE = False

# Define skip markers
requires_evaluation = pytest.mark.skipif(
    not EVALUATION_DEPS_AVAILABLE, reason="Requires [evaluation] extras"
)

requires_trajectory = pytest.mark.skipif(
    not TRAJECTORY_DEPS_AVAILABLE, reason="Requires [evaluation] extras with torch"
)


@pytest.fixture(scope="session")
def cert_version():
    """Get CERT framework version."""
    import cert

    return cert.__version__
