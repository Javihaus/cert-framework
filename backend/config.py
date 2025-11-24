"""
Backend Configuration
====================

Centralized configuration for backend services using environment variables.
"""

import os
from typing import Optional


class Config:
    """Backend configuration from environment variables."""

    # Redis Configuration
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")

    # MinIO Configuration
    MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    MINIO_ACCESS_KEY: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    MINIO_SECRET_KEY: str = os.getenv("MINIO_SECRET_KEY", "minioadmin123")
    MINIO_BUCKET: str = os.getenv("MINIO_BUCKET", "cert-documents")
    MINIO_REPORTS_BUCKET: str = os.getenv("MINIO_REPORTS_BUCKET", "cert-reports")
    MINIO_SECURE: bool = os.getenv("MINIO_SECURE", "false").lower() == "true"

    # Supabase Configuration
    SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL")
    SUPABASE_KEY: Optional[str] = os.getenv("SUPABASE_KEY")

    # API Configuration
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))

    # Worker Configuration
    WORKER_CONCURRENCY: int = int(os.getenv("WORKER_CONCURRENCY", "4"))

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "info")

    # Paths
    TEMPLATES_DIR: str = os.getenv("TEMPLATES_DIR", "/app/templates")
    SCRIPTS_DIR: str = os.getenv("SCRIPTS_DIR", "/app/scripts")

    @classmethod
    def validate(cls) -> None:
        """Validate required configuration."""
        errors = []

        if not cls.REDIS_URL:
            errors.append("REDIS_URL is required")

        if not cls.MINIO_ENDPOINT:
            errors.append("MINIO_ENDPOINT is required")

        if not cls.MINIO_ACCESS_KEY:
            errors.append("MINIO_ACCESS_KEY is required")

        if not cls.MINIO_SECRET_KEY:
            errors.append("MINIO_SECRET_KEY is required")

        if errors:
            raise ValueError(f"Configuration errors: {', '.join(errors)}")

    @classmethod
    def display(cls) -> str:
        """Display configuration (masking secrets)."""
        return f"""
Backend Configuration:
----------------------
Redis URL: {cls.REDIS_URL}
Celery Broker: {cls.CELERY_BROKER_URL}
MinIO Endpoint: {cls.MINIO_ENDPOINT}
MinIO Bucket: {cls.MINIO_BUCKET}
MinIO Secure: {cls.MINIO_SECURE}
Supabase URL: {cls.SUPABASE_URL or 'Not configured'}
Worker Concurrency: {cls.WORKER_CONCURRENCY}
Log Level: {cls.LOG_LEVEL}
"""


# Validate on import
Config.validate()
