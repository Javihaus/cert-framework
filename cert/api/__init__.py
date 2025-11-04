"""
CERT API package.

Provides FastAPI backend services for report generation and other API endpoints.
"""

from cert.api.report_api import app

__all__ = ["app"]
