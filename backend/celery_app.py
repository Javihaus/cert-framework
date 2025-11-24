"""
Celery Application
=================

Celery app configuration for background task processing.
"""

from celery import Celery
from backend.config import Config

# Create Celery app
app = Celery(
    "cert-backend",
    broker=Config.CELERY_BROKER_URL,
    backend=Config.CELERY_RESULT_BACKEND,
    include=[
        "backend.tasks.document_generation",
        "backend.tasks.audit_runner",
        "backend.tasks.pdf_generation",
    ],
)

# Celery configuration
app.conf.update(
    # Task execution settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Task routing
    task_routes={
        "backend.tasks.document_generation.*": {"queue": "documents"},
        "backend.tasks.audit_runner.*": {"queue": "audits"},
        "backend.tasks.pdf_generation.*": {"queue": "pdfs"},
    },
    # Task time limits
    task_time_limit=600,  # 10 minutes hard limit
    task_soft_time_limit=540,  # 9 minutes soft limit
    # Result backend settings
    result_expires=3600,  # Results expire after 1 hour
    result_extended=True,
    # Worker settings
    worker_prefetch_multiplier=1,  # Prevent memory issues
    worker_max_tasks_per_child=100,  # Restart worker after 100 tasks
    # Retry settings
    task_acks_late=True,  # Acknowledge tasks after completion
    task_reject_on_worker_lost=True,
)

# Task autodiscovery
app.autodiscover_tasks(["backend.tasks"])


@app.task(bind=True, name="debug_task")
def debug_task(self):
    """Debug task for testing Celery configuration."""
    print(f"Request: {self.request!r}")
    return {"status": "success", "message": "Debug task completed"}


if __name__ == "__main__":
    app.start()
