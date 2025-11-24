# CERT Backend Services Dockerfile
# Multi-stage build for production-grade Python backend

FROM python:3.11-slim as base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libcairo2 \
    libgdk-pixbuf2.0-0 \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt requirements-backend.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir -r requirements-backend.txt

# Development stage
FROM base as development

# Copy application code
COPY cert/ ./cert/
COPY backend/ ./backend/
COPY templates/ ./templates/
COPY scripts/ ./scripts/
COPY database/ ./database/

# Set Python path
ENV PYTHONPATH=/app

# Expose ports
EXPOSE 8000 5555

# Default command (can be overridden in docker-compose)
CMD ["uvicorn", "cert.api.server:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Production stage
FROM base as production

# Create non-root user
RUN useradd -m -u 1000 certuser && \
    mkdir -p /app && \
    chown -R certuser:certuser /app

# Copy application code
COPY --chown=certuser:certuser cert/ ./cert/
COPY --chown=certuser:certuser backend/ ./backend/
COPY --chown=certuser:certuser templates/ ./templates/
COPY --chown=certuser:certuser scripts/ ./scripts/
COPY --chown=certuser:certuser database/ ./database/

# Switch to non-root user
USER certuser

# Set Python path
ENV PYTHONPATH=/app

# Expose ports
EXPOSE 8000 5555

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default command
CMD ["uvicorn", "cert.api.server:app", "--host", "0.0.0.0", "--port", "8000"]
