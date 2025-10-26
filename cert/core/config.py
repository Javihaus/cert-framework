"""
Configuration management for CERT Framework.

Provides:
- Environment-based configuration
- Configuration validation
- Default values
"""

import os
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class LoggingConfig:
    """Logging configuration."""
    level: str = "INFO"
    format: str = "json"  # "json" or "human"
    output: str = "stdout"  # "stdout", "file", or "both"
    log_file: Optional[str] = None

    @classmethod
    def from_env(cls) -> "LoggingConfig":
        """Load configuration from environment variables."""
        return cls(
            level=os.getenv("LOG_LEVEL", "INFO"),
            format=os.getenv("LOG_FORMAT", "json"),
            output=os.getenv("LOG_OUTPUT", "stdout"),
            log_file=os.getenv("LOG_FILE"),
        )


@dataclass
class MetricsConfig:
    """Metrics configuration."""
    enabled: bool = True
    namespace: str = "cert"
    port: int = 9090
    host: str = "0.0.0.0"

    @classmethod
    def from_env(cls) -> "MetricsConfig":
        """Load configuration from environment variables."""
        return cls(
            enabled=os.getenv("METRICS_ENABLED", "true").lower() == "true",
            namespace=os.getenv("METRICS_NAMESPACE", "cert"),
            port=int(os.getenv("METRICS_PORT", "9090")),
            host=os.getenv("METRICS_HOST", "0.0.0.0"),
        )


@dataclass
class ResourceConfig:
    """Resource management configuration."""
    preload_models: bool = True
    device: str = "auto"  # "auto", "cuda", "cpu"
    max_memory_gb: Optional[float] = None

    @classmethod
    def from_env(cls) -> "ResourceConfig":
        """Load configuration from environment variables."""
        max_memory = os.getenv("MAX_MEMORY_GB")
        return cls(
            preload_models=os.getenv("PRELOAD_MODELS", "true").lower() == "true",
            device=os.getenv("DEVICE", "auto"),
            max_memory_gb=float(max_memory) if max_memory else None,
        )


@dataclass
class CERTConfig:
    """Main CERT Framework configuration."""
    logging: LoggingConfig = field(default_factory=LoggingConfig)
    metrics: MetricsConfig = field(default_factory=MetricsConfig)
    resources: ResourceConfig = field(default_factory=ResourceConfig)

    @classmethod
    def from_env(cls) -> "CERTConfig":
        """Load all configuration from environment variables."""
        return cls(
            logging=LoggingConfig.from_env(),
            metrics=MetricsConfig.from_env(),
            resources=ResourceConfig.from_env(),
        )

    def apply(self):
        """Apply configuration to CERT Framework."""
        from cert.observability import configure_logging

        # Configure logging
        configure_logging(
            level=self.logging.level,
            format=self.logging.format,
            output=self.logging.output,
            log_file=self.logging.log_file,
        )
