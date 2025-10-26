"""
Structured logging configuration.

Provides:
- JSON structured logging
- Correlation IDs for request tracing
- Log level configuration per module
- Integration with ELK/Datadog/CloudWatch
"""

import json
import logging
import logging.handlers
import sys
from contextlib import contextmanager
from datetime import datetime
from typing import Optional


class JsonFormatter(logging.Formatter):
    """JSON log formatter with structured fields."""

    def format(self, record: logging.LogRecord) -> str:
        """
        Format log record as JSON.

        Args:
            record: Log record to format

        Returns:
            JSON formatted log string
        """
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add extra fields from 'extra' parameter
        if hasattr(record, "__dict__"):
            for key, value in record.__dict__.items():
                if key not in [
                    "name", "msg", "args", "created", "filename", "funcName",
                    "levelname", "levelno", "lineno", "module", "msecs",
                    "message", "pathname", "process", "processName",
                    "relativeCreated", "stack_info", "thread", "threadName",
                    "exc_info", "exc_text",
                ]:
                    log_data[key] = value

        # Add correlation ID if present
        if hasattr(record, "correlation_id"):
            log_data["correlation_id"] = record.correlation_id

        # Add exception info
        if record.exc_info:
            log_data["exception"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                "message": str(record.exc_info[1]) if record.exc_info[1] else None,
                "traceback": self.formatException(record.exc_info) if record.exc_info else None,
            }

        return json.dumps(log_data, default=str)


class HumanReadableFormatter(logging.Formatter):
    """Human-readable formatter for development."""

    def __init__(self):
        super().__init__(
            fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )


def configure_logging(
    level: str = "INFO",
    format: str = "json",
    output: str = "stdout",
    log_file: Optional[str] = None,
    max_file_size: int = 100 * 1024 * 1024,  # 100MB
    backup_count: int = 10,
) -> None:
    """
    Configure structured logging for CERT Framework.

    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        format: Log format ("json" or "human")
        output: Output destination ("stdout", "file", or "both")
        log_file: Log file path (required if output includes "file")
        max_file_size: Maximum log file size in bytes
        backup_count: Number of backup log files to keep
    """
    # Select formatter
    if format == "json":
        formatter = JsonFormatter()
    else:
        formatter = HumanReadableFormatter()

    # Configure root logger for CERT
    cert_logger = logging.getLogger("cert")
    cert_logger.setLevel(getattr(logging, level.upper()))

    # Remove existing handlers
    cert_logger.handlers.clear()

    # Add console handler
    if output in ("stdout", "both"):
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        cert_logger.addHandler(console_handler)

    # Add file handler
    if output in ("file", "both"):
        if not log_file:
            raise ValueError("log_file must be specified when output includes 'file'")

        file_handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=max_file_size,
            backupCount=backup_count,
        )
        file_handler.setFormatter(formatter)
        cert_logger.addHandler(file_handler)

    # Prevent propagation to root logger
    cert_logger.propagate = False

    cert_logger.info(
        "Logging configured",
        extra={
            "level": level,
            "format": format,
            "output": output,
            "log_file": log_file,
        }
    )


@contextmanager
def correlation_id_context(correlation_id: str):
    """
    Set correlation ID for all logs in this context.

    Args:
        correlation_id: Unique identifier for request tracing

    Example:
        with correlation_id_context("req-123"):
            logger.info("Processing request")  # Will include correlation_id
    """
    old_factory = logging.getLogRecordFactory()

    def record_factory(*args, **kwargs):
        record = old_factory(*args, **kwargs)
        record.correlation_id = correlation_id
        return record

    logging.setLogRecordFactory(record_factory)
    try:
        yield
    finally:
        logging.setLogRecordFactory(old_factory)
