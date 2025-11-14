"""
Connector Registry and Auto-Discovery System
============================================

This module provides automatic registration and activation of platform connectors.
Connectors register themselves using the @register_connector decorator, and can be
activated all at once with a single call.

Design:
- Zero-configuration: Import cert.integrations.auto and everything activates
- Fault-tolerant: Missing dependencies don't break other connectors
- Extensible: New connectors self-register with a decorator
"""

import logging
from typing import List, Optional, Type

from cert.integrations.base import ConnectorAdapter

logger = logging.getLogger(__name__)


# Global registry of all connector classes
_active_connectors: List[Type[ConnectorAdapter]] = []

# Track activated connector instances
_activated_instances: List[ConnectorAdapter] = []


def register_connector(connector_class: Type[ConnectorAdapter]) -> Type[ConnectorAdapter]:
    """
    Decorator to register a connector class for auto-activation.

    This decorator should be applied to all ConnectorAdapter subclasses
    to make them discoverable by the auto-activation system.

    Example:
        @register_connector
        class OpenAIConnector(ConnectorAdapter):
            def activate(self):
                # Installation logic here
                pass
            ...

    Args:
        connector_class: The connector class to register

    Returns:
        The same connector class (this is a transparent decorator)
    """
    if not issubclass(connector_class, ConnectorAdapter):
        raise TypeError(
            f"Connector class {connector_class.__name__} must inherit from ConnectorAdapter"
        )

    _active_connectors.append(connector_class)
    logger.debug(f"Registered connector: {connector_class.__name__}")

    return connector_class


def activate_all(tracer, skip_on_import_error: bool = True) -> List[ConnectorAdapter]:
    """
    Activate all registered connectors.

    This function attempts to activate every connector that has been registered
    via the @register_connector decorator. Connectors whose platform SDKs are
    not installed will be skipped (if skip_on_import_error=True).

    Args:
        tracer: The CERT tracer instance to pass to connectors
        skip_on_import_error: If True, skip connectors whose platforms aren't installed

    Returns:
        List of successfully activated connector instances

    Example:
        from cert import get_tracer
        from cert.integrations.registry import activate_all

        tracer = get_tracer()
        connectors = activate_all(tracer)
        print(f"Activated {len(connectors)} connectors")
    """
    activated = []

    for connector_cls in _active_connectors:
        try:
            # Instantiate the connector
            connector = connector_cls(tracer)

            # Activate it
            connector.activate()

            # Track the instance
            activated.append(connector)
            _activated_instances.append(connector)

            logger.info(f"Activated connector: {connector_cls.__name__}")

        except ImportError as e:
            if skip_on_import_error:
                logger.debug(f"Skipping {connector_cls.__name__}: Platform not installed ({e})")
            else:
                logger.error(f"Failed to activate {connector_cls.__name__}: {e}")
                raise

        except Exception as e:
            logger.error(f"Failed to activate {connector_cls.__name__}: {e}", exc_info=True)
            # Don't raise - we want other connectors to still activate

    logger.info(f"Activated {len(activated)}/{len(_active_connectors)} connectors")

    return activated


def get_active_connectors() -> List[ConnectorAdapter]:
    """
    Get all currently activated connector instances.

    Returns:
        List of activated ConnectorAdapter instances
    """
    return _activated_instances.copy()


def get_registered_connector_classes() -> List[Type[ConnectorAdapter]]:
    """
    Get all registered connector classes.

    Returns:
        List of registered ConnectorAdapter classes
    """
    return _active_connectors.copy()


def deactivate_all() -> None:
    """
    Deactivate all connectors.

    This disables all currently active connectors by setting their
    enabled flag to False. Note: This does not uninstall hooks or
    undo monkey-patches. For a full reset, restart your Python process.
    """
    for connector in _activated_instances:
        connector.enabled = False

    logger.info(f"Deactivated {len(_activated_instances)} connectors")


def reset_registry() -> None:
    """
    Reset the registry (mainly for testing).

    Clears both the registered classes and activated instances.
    """
    global _active_connectors, _activated_instances
    _active_connectors = []
    _activated_instances = []
    logger.debug("Registry reset")


def get_connector_status() -> List[dict]:
    """
    Get the status of all activated connectors.

    Returns:
        List of dictionaries with connector status information
    """
    status = []

    for connector in _activated_instances:
        status.append(
            {
                "name": connector.__class__.__name__,
                "enabled": connector.enabled,
                "healthy": connector.is_healthy(),
                "failure_count": connector.failure_count,
            }
        )

    return status


def find_connector_by_platform(platform: str) -> Optional[ConnectorAdapter]:
    """
    Find an activated connector by platform name.

    Args:
        platform: Platform identifier (e.g., "openai", "anthropic")

    Returns:
        The connector instance, or None if not found
    """
    for connector in _activated_instances:
        # Try to match by class name (e.g., OpenAIConnector -> "openai")
        class_name = connector.__class__.__name__.lower()
        if platform.lower() in class_name:
            return connector

    return None


# Health monitoring utilities
def check_connector_health() -> dict:
    """
    Check the health of all connectors.

    Returns:
        Dictionary with overall health status and per-connector details
    """
    total = len(_activated_instances)
    healthy = sum(1 for c in _activated_instances if c.is_healthy())
    unhealthy = total - healthy

    return {
        "total_connectors": total,
        "healthy": healthy,
        "unhealthy": unhealthy,
        "health_percentage": (healthy / total * 100) if total > 0 else 0,
        "connectors": get_connector_status(),
    }


def reset_all_circuit_breakers() -> None:
    """
    Reset circuit breakers for all connectors.

    This can be used to re-enable connectors that were disabled
    after repeated failures.
    """
    for connector in _activated_instances:
        connector.reset_circuit_breaker()

    logger.info("Reset all circuit breakers")
