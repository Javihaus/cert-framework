"""
CERT Framework v3.0
===================

EU AI Act Article 15 Compliance Framework for LLM Systems

Clean, simple API for consistency measurement and monitoring.

Public API:
    - measure(): Measure consistency between two texts
    - monitor(): Decorator for monitoring LLM outputs
    - Preset: Industry preset configurations
    - PRESETS: Available preset definitions

Example Usage:
    >>> from cert import measure, monitor
    >>>
    >>> # Measure consistency
    >>> result = measure(
    ...     text1="Revenue was $5M in Q4",
    ...     text2="Q4 revenue reached $5M"
    ... )
    >>> print(f"Confidence: {result.confidence}")
    >>>
    >>> # Monitor with preset
    >>> @monitor(preset="healthcare")
    ... def my_rag_pipeline(query):
    ...     context = retrieve(query)
    ...     answer = llm(context, query)
    ...     return answer

For detailed documentation, see: https://github.com/Javihaus/cert-framework
"""

__version__ = "3.0.0"
__author__ = "Javier Marin"
__license__ = "MIT"

# Public API - This is all users need to import
from cert.measure import measure
from cert.monitor import monitor
from cert.utils import Preset, PRESETS, export_report

__all__ = [
    "measure",
    "monitor",
    "Preset",
    "PRESETS",
    "export_report",
]
