"""Pytest configuration for CERT Framework tests."""

import pytest


@pytest.fixture(scope="session")
def cert_version():
    """Get CERT framework version."""
    import cert
    return cert.__version__
