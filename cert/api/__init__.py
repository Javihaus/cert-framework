"""
CERT API Server
===============

FastAPI server for self-hosted dashboard integration.

Provides endpoints for:
- Connector status and health checks
- Cost analysis and trends
- Optimization recommendations
- Live trace streaming

Usage:
    cert serve                    # Start on localhost:8000
    cert serve --port 9000        # Custom port
    cert serve --host 0.0.0.0     # Bind to all interfaces
"""

from cert.api.server import app

__all__ = ["app"]
