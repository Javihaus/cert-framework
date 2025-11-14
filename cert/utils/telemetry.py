"""
Anonymous Telemetry for CERT Framework
=======================================

Opt-in anonymous usage telemetry to help improve the framework.

NO USER DATA OR TRACES ARE COLLECTED - only anonymous usage patterns.
"""

import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

# Telemetry is OPT-IN only
TELEMETRY_ENABLED = os.environ.get("CERT_TELEMETRY", "").lower() in ("1", "true", "yes")
TELEMETRY_ENDPOINT = "https://telemetry.cert-framework.com/event"


def get_anonymous_id() -> str:
    """
    Get or create anonymous installation ID.

    This ID is generated once and stored locally. It's used to understand
    unique installations without identifying users.

    Returns:
        Anonymous ID string
    """
    config_dir = Path.home() / ".cert"
    config_dir.mkdir(exist_ok=True)

    id_file = config_dir / "installation_id"

    if id_file.exists():
        return id_file.read_text().strip()

    # Generate new ID (hash of timestamp + random)
    import uuid

    installation_id = str(uuid.uuid4())

    id_file.write_text(installation_id)
    return installation_id


def track_event(event_name: str, properties: Optional[Dict[str, Any]] = None):
    """
    Track an anonymous event.

    PRIVACY: Only anonymous usage patterns are tracked. NO user data,
    NO trace content, NO sensitive information.

    Args:
        event_name: Name of the event (e.g., "connector_activated")
        properties: Anonymous event properties

    Example:
        track_event("connector_activated", {
            "platform": "openai",  # Platform name (public info)
            "cert_version": "2.0"  # CERT version
        })

        NOT tracked:
        - User prompts or responses
        - API keys or credentials
        - User data or identifiers
        - Trace contents
    """
    if not TELEMETRY_ENABLED:
        return

    try:
        import requests
    except ImportError:
        logger.debug("Telemetry disabled: requests library not available")
        return

    # Build telemetry payload
    payload = {
        "event": event_name,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "installation_id": get_anonymous_id(),
        "cert_version": get_cert_version(),
        "properties": properties or {},
    }

    # Remove any potentially sensitive data
    payload = sanitize_telemetry(payload)

    # Send asynchronously (fire and forget)
    try:
        requests.post(
            TELEMETRY_ENDPOINT,
            json=payload,
            timeout=2,
            headers={"Content-Type": "application/json"},
        )
        logger.debug(f"Telemetry event sent: {event_name}")
    except Exception as e:
        # Never fail if telemetry fails
        logger.debug(f"Telemetry send failed: {e}")


def sanitize_telemetry(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Remove any potentially sensitive data from telemetry.

    Args:
        payload: Telemetry payload

    Returns:
        Sanitized payload
    """
    # Whitelist of allowed property keys
    allowed_keys = {
        "platform",
        "connector_name",
        "event_type",
        "cert_version",
        "python_version",
        "os",
        "connector_count",
        "model_family",  # e.g., "gpt-4" but not full model string
    }

    if "properties" in payload:
        sanitized_props = {}
        for key, value in payload["properties"].items():
            if key in allowed_keys:
                # Further sanitize values
                if isinstance(value, str):
                    # Remove any long strings that might contain data
                    if len(value) > 100:
                        continue
                sanitized_props[key] = value

        payload["properties"] = sanitized_props

    return payload


def get_cert_version() -> str:
    """Get CERT framework version."""
    try:
        from cert import __version__

        return __version__
    except ImportError:
        return "unknown"


def get_system_info() -> Dict[str, str]:
    """
    Get anonymous system information.

    Returns:
        Dictionary with OS and Python version only
    """
    import platform
    import sys

    return {
        "os": platform.system(),  # e.g., "Linux", "Darwin", "Windows"
        "python_version": f"{sys.version_info.major}.{sys.version_info.minor}",
    }


# Event tracking functions


def track_connector_activated(connector_name: str, platform: str):
    """Track connector activation."""
    track_event(
        "connector_activated",
        {
            "connector_name": connector_name,
            "platform": platform,
            **get_system_info(),
        },
    )


def track_connector_failed(connector_name: str):
    """Track connector failure (no error details)."""
    track_event(
        "connector_failed",
        {
            "connector_name": connector_name,
        },
    )


def track_cli_command(command: str):
    """Track CLI command usage."""
    track_event(
        "cli_command_used",
        {
            "command": command,
            **get_system_info(),
        },
    )


def track_assessment_completed(risk_level: str):
    """Track assessment completion (no user data)."""
    track_event(
        "assessment_completed",
        {
            "risk_level": risk_level,  # Public classification
        },
    )


def enable_telemetry():
    """
    Enable telemetry for this session.

    To persist, set environment variable:
        export CERT_TELEMETRY=1
    """
    global TELEMETRY_ENABLED
    TELEMETRY_ENABLED = True
    logger.info("Telemetry enabled for this session")


def disable_telemetry():
    """
    Disable telemetry for this session.

    To persist, unset environment variable:
        unset CERT_TELEMETRY
    """
    global TELEMETRY_ENABLED
    TELEMETRY_ENABLED = False
    logger.info("Telemetry disabled")


def is_telemetry_enabled() -> bool:
    """Check if telemetry is enabled."""
    return TELEMETRY_ENABLED


def show_telemetry_info():
    """
    Show information about telemetry.

    Prints what is tracked and what is NOT tracked.
    """
    print(
        """
CERT Framework Telemetry
========================

Status: {}

What We Track (Anonymous Only):
✓ Connector activations (e.g., "openai", "anthropic")
✓ CLI command usage (e.g., "assess", "costs")
✓ CERT version and Python version
✓ Operating system (Linux/macOS/Windows)
✓ Installation ID (random UUID, not linked to you)

What We DO NOT Track:
✗ Your prompts or LLM responses
✗ Your API keys or credentials
✗ Your trace data or content
✗ Your personal information
✗ Your IP address
✗ Any user data

Why?
----
Anonymous usage data helps us:
- Understand which connectors are most used
- Prioritize development efforts
- Identify common issues

Privacy
-------
No user data or sensitive information is ever collected.
You can disable telemetry at any time.

Commands:
---------
Enable:  export CERT_TELEMETRY=1
Disable: unset CERT_TELEMETRY
Check:   echo $CERT_TELEMETRY

Learn more: https://cert-framework.com/telemetry
""".format("ENABLED" if TELEMETRY_ENABLED else "DISABLED")
    )


# Print notice on first import if enabled
if TELEMETRY_ENABLED:
    logger.info(
        "Anonymous telemetry enabled. "
        "Run 'python -c \"from cert.utils.telemetry import show_telemetry_info; show_telemetry_info()\"' "
        "to see what's tracked. Disable: unset CERT_TELEMETRY"
    )
