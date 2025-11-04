# CERT Framework v4.0 - Lightweight Docker Image
#
# Build options:
#   docker build -t cert-framework:core .                    # Core only (~50MB)
#   docker build --build-arg EXTRAS=evaluation -t cert-framework:eval .  # With evaluation (~500MB)
#   docker build --build-arg EXTRAS=all -t cert-framework:full .         # Everything

FROM python:3.11-slim as base

# Metadata
LABEL maintainer="info@cert-framework.com"
LABEL description="CERT Framework - LLM Monitoring with EU AI Act Compliance"
LABEL version="4.0.0"

# Set working directory
WORKDIR /app

# Install system dependencies (minimal)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements first (for layer caching)
COPY setup.py pyproject.toml README.md ./
COPY cert/ ./cert/

# Build argument for extras
ARG EXTRAS=""

# Install CERT Framework
RUN if [ -z "$EXTRAS" ]; then \
        pip install --no-cache-dir -e .; \
    else \
        pip install --no-cache-dir -e ".[$EXTRAS]"; \
    fi

# Create directory for logs
RUN mkdir -p /var/log/cert

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV CERT_LOG_PATH=/var/log/cert/traces.jsonl

# Default command (shows help)
CMD ["python", "-c", "from cert import __version__; print(f'CERT Framework v{__version__}'); print('Use this image to run your monitoring scripts.')"]

# Example usage in the image:
# COPY your_app.py /app/
# CMD ["python", "your_app.py"]
