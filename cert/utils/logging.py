"""
Structured Logging for CERT Framework
======================================

Provides structured logging capabilities for better observability
and debugging.
"""

import json
import logging
import sys
from datetime import datetime
from typing import Any, Dict, Optional


class StructuredFormatter(logging.Formatter):
    """
    JSON formatter for structured logging.

    Outputs logs in JSON format for easy parsing and analysis.
    """

    def format(self, record: logging.LogRecord) -> str:
        """
        Format log record as JSON.

        Args:
            record: Log record to format

        Returns:
            JSON-formatted log string
        """
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Add extra fields
        if hasattr(record, "connector_name"):
            log_data["connector_name"] = record.connector_name

        if hasattr(record, "platform"):
            log_data["platform"] = record.platform

        if hasattr(record, "trace_id"):
            log_data["trace_id"] = record.trace_id

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Add any custom fields
        for key, value in record.__dict__.items():
            if key not in [
                "name",
                "msg",
                "args",
                "created",
                "filename",
                "funcName",
                "levelname",
                "levelno",
                "lineno",
                "module",
                "msecs",
                "message",
                "pathname",
                "process",
                "processName",
                "relativeCreated",
                "thread",
                "threadName",
                "exc_info",
                "exc_text",
                "stack_info",
            ]:
                if not key.startswith("_"):
                    log_data[key] = value

        return json.dumps(log_data)


class CERTLogger:
    """
    Enhanced logger for CERT framework.

    Provides structured logging with context managers and
    additional helper methods.
    """

    def __init__(self, name: str, level: int = logging.INFO):
        """
        Initialize logger.

        Args:
            name: Logger name
            level: Logging level
        """
        self.logger = logging.getLogger(name)
        self.logger.setLevel(level)

    def with_context(self, **context) -> "LoggerContext":
        """
        Create a context manager that adds context to all logs.

        Usage:
            with logger.with_context(connector_name="openai", trace_id="123"):
                logger.info("Processing request")

        Args:
            **context: Context fields to add

        Returns:
            LoggerContext instance
        """
        return LoggerContext(self.logger, context)

    def debug(self, msg: str, **kwargs):
        """Log debug message with extra context."""
        self.logger.debug(msg, extra=kwargs)

    def info(self, msg: str, **kwargs):
        """Log info message with extra context."""
        self.logger.info(msg, extra=kwargs)

    def warning(self, msg: str, **kwargs):
        """Log warning message with extra context."""
        self.logger.warning(msg, extra=kwargs)

    def error(self, msg: str, **kwargs):
        """Log error message with extra context."""
        self.logger.error(msg, extra=kwargs)

    def critical(self, msg: str, **kwargs):
        """Log critical message with extra context."""
        self.logger.critical(msg, extra=kwargs)

    def connector_activated(self, connector_name: str, platform: str):
        """Log connector activation."""
        self.info(
            f"Connector activated: {connector_name}",
            connector_name=connector_name,
            platform=platform,
            event_type="connector_activated",
        )

    def connector_failed(self, connector_name: str, error: str):
        """Log connector failure."""
        self.error(
            f"Connector failed: {connector_name}",
            connector_name=connector_name,
            error=error,
            event_type="connector_failed",
        )

    def trace_logged(self, platform: str, model: str, cost: Optional[float] = None):
        """Log successful trace."""
        self.debug(
            f"Trace logged: {platform}/{model}",
            platform=platform,
            model=model,
            cost=cost,
            event_type="trace_logged",
        )

    def performance_warning(self, connector_name: str, overhead_ms: float):
        """Log performance warning."""
        self.warning(
            f"High overhead detected: {connector_name} ({overhead_ms:.2f}ms)",
            connector_name=connector_name,
            overhead_ms=overhead_ms,
            event_type="performance_warning",
        )


class LoggerContext:
    """Context manager for adding context to logs."""

    def __init__(self, logger: logging.Logger, context: Dict[str, Any]):
        self.logger = logger
        self.context = context
        self.old_factory = None

    def __enter__(self):
        old_factory = logging.getLogRecordFactory()

        def record_factory(*args, **kwargs):
            record = old_factory(*args, **kwargs)
            for key, value in self.context.items():
                setattr(record, key, value)
            return record

        logging.setLogRecordFactory(record_factory)
        self.old_factory = old_factory
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.old_factory:
            logging.setLogRecordFactory(self.old_factory)


def setup_logging(level: str = "INFO", structured: bool = False, log_file: Optional[str] = None):
    """
    Set up logging for CERT framework.

    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        structured: Use JSON-formatted structured logging
        log_file: Optional file to log to
    """
    log_level = getattr(logging, level.upper(), logging.INFO)

    # Create formatter
    if structured:
        formatter = StructuredFormatter()
    else:
        formatter = logging.Formatter(
            fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)

    # File handler (if specified)
    handlers = [console_handler]
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(log_level)
        file_handler.setFormatter(formatter)
        handlers.append(file_handler)

    # Configure root logger
    root_logger = logging.getLogger("cert")
    root_logger.setLevel(log_level)

    # Remove existing handlers
    root_logger.handlers.clear()

    # Add new handlers
    for handler in handlers:
        root_logger.addHandler(handler)


def get_logger(name: str) -> CERTLogger:
    """
    Get a CERT logger instance.

    Args:
        name: Logger name

    Returns:
        CERTLogger instance
    """
    return CERTLogger(f"cert.{name}")


# Example usage for developers
if __name__ == "__main__":
    # Setup structured logging
    setup_logging(level="DEBUG", structured=True)

    logger = get_logger("example")

    # Basic logging
    logger.info("Application started")

    # Logging with context
    with logger.with_context(user_id="123", request_id="abc"):
        logger.info("Processing request")
        logger.debug("Request details", path="/api/trace")

    # Connector-specific logging
    logger.connector_activated("openai", "openai")
    logger.trace_logged("openai", "gpt-4", cost=0.0042)
    logger.performance_warning("openai", 12.5)
