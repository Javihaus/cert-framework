"""
Auto-Activation Module for CERT Connectors
==========================================

Import this module to automatically activate all registered connectors.

Usage:
    # Single import activates everything
    import cert.integrations.auto

    # Or explicitly
    from cert.integrations.auto import auto_activate
    auto_activate()

This module:
1. Imports all connector modules to trigger registration
2. Activates all registered connectors automatically
3. Provides zero-configuration setup for end users
"""

import logging
import os

from cert.integrations.registry import activate_all, get_connector_status

logger = logging.getLogger(__name__)


def auto_activate(tracer=None):
    """
    Automatically activate all registered connectors.

    This function:
    1. Gets or creates a tracer instance
    2. Imports all connector modules to trigger registration
    3. Activates all registered connectors

    Args:
        tracer: Optional tracer instance. If None, uses the default tracer.

    Returns:
        List of activated connector instances
    """
    # Get tracer if not provided
    if tracer is None:
        try:
            from cert.core.api import get_tracer

            tracer = get_tracer()
        except ImportError:
            logger.warning(
                "Could not import default tracer. "
                "Please provide a tracer instance to auto_activate()"
            )
            return []

    # Import all connector modules to trigger @register_connector decorators
    # Each connector module will register itself when imported
    _import_all_connectors()

    # Activate all registered connectors
    connectors = activate_all(tracer, skip_on_import_error=True)

    logger.info(f"Auto-activated {len(connectors)} connectors")

    # Log status
    status = get_connector_status()
    for connector_status in status:
        logger.debug(
            f"  {connector_status['name']}: "
            f"enabled={connector_status['enabled']}, "
            f"healthy={connector_status['healthy']}"
        )

    return connectors


def _import_all_connectors():
    """
    Import all connector modules to trigger registration.

    This function attempts to import all known connector modules.
    Import errors are silently ignored (the platform SDK may not be installed).
    """
    # List of all connector modules
    connector_modules = [
        "cert.integrations.openai_connector",
        "cert.integrations.langchain_connector",
        "cert.integrations.bedrock_connector",
        "cert.integrations.anthropic_connector",
        "cert.integrations.azure_openai_connector",
        # Add more as they're implemented
    ]

    for module_name in connector_modules:
        try:
            __import__(module_name)
            logger.debug(f"Imported {module_name}")
        except ImportError as e:
            # Platform SDK not installed, skip silently
            logger.debug(f"Skipping {module_name}: {e}")
        except Exception as e:
            # Other error, log but don't fail
            logger.warning(f"Error importing {module_name}: {e}")


# Auto-activate on module import if CERT_AUTO_ACTIVATE is set
if os.environ.get("CERT_AUTO_ACTIVATE", "").lower() in ("1", "true", "yes"):
    logger.info("CERT_AUTO_ACTIVATE is set, auto-activating connectors")
    auto_activate()
