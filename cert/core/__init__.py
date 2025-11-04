"""
Core infrastructure for CERT Framework.

This module provides production-grade infrastructure components:
- Resource management (lifecycle, context managers)
- Error handling (structured exceptions)
- Configuration management
"""

from cert.core.errors import (
    AnalysisError,
    CERTError,
    EmbeddingTimeoutError,
    GPUOutOfMemoryError,
    InvalidInputError,
    ResourceError,
    ResourceLoadError,
)
from cert.core.resources import (
    ModelResource,
    ResourceManager,
)

__all__ = [
    # Errors
    "CERTError",
    "ResourceError",
    "ResourceLoadError",
    "GPUOutOfMemoryError",
    "EmbeddingTimeoutError",
    "InvalidInputError",
    "AnalysisError",
    # Resources
    "ResourceManager",
    "ModelResource",
]
