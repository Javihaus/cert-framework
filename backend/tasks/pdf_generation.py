"""
PDF Generation Tasks
===================

Celery tasks for PDF report generation.
"""

import logging
from pathlib import Path
from typing import Any, Dict
from uuid import uuid4

from celery import Task
from backend.celery_app import app
from backend.config import Config
from backend.storage.minio_client import get_minio_client

logger = logging.getLogger(__name__)


class PDFGenerationTask(Task):
    """Base task for PDF generation with error handling."""

    autoretry_for = (Exception,)
    retry_kwargs = {"max_retries": 3}
    retry_backoff = True


@app.task(bind=True, base=PDFGenerationTask, name="generate_assessment_pdf", time_limit=180)
def generate_assessment_pdf(self, report_data: Dict[str, Any]) -> Dict[str, str]:
    """
    Generate PDF from assessment report data.

    This task:
    1. Renders HTML template with report data
    2. Converts HTML to PDF using WeasyPrint
    3. Uploads PDF to MinIO
    4. Returns download URL

    Args:
        report_data: Assessment report data

    Returns:
        Dict with:
        - job_id: Task ID
        - status: 'completed'
        - file_url: MinIO download URL
        - file_name: PDF file name

    Raises:
        Exception: If PDF generation fails
    """
    job_id = self.request.id
    logger.info(f"[Job {job_id}] Starting PDF generation")

    try:
        # Import here to avoid loading heavy dependencies on worker startup
        import subprocess
        import tempfile

        # Create temporary directory
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)

            # Path to PDF generation script
            script_path = Path(Config.SCRIPTS_DIR) / "generate_assessment_pdf.py"

            if not script_path.exists():
                raise FileNotFoundError(f"PDF generation script not found: {script_path}")

            # Write report data to temp file
            import json

            report_path = temp_path / "report.json"
            with open(report_path, "w") as f:
                json.dump(report_data, f, indent=2)

            # Output PDF path
            pdf_path = temp_path / "assessment_report.pdf"

            logger.info(f"[Job {job_id}] Running PDF generation script")

            # Run PDF generation script
            result = subprocess.run(
                [
                    "python3",
                    str(script_path),
                    str(report_path),
                    "--output",
                    str(pdf_path),
                ],
                capture_output=True,
                text=True,
                timeout=120,  # 2 minute timeout
            )

            if result.returncode != 0:
                logger.error(f"[Job {job_id}] PDF generation failed: {result.stderr}")
                raise Exception(f"PDF generation failed: {result.stderr}")

            logger.info(f"[Job {job_id}] PDF generated: {pdf_path.stat().st_size} bytes")

            # Upload to MinIO
            minio_client = get_minio_client()

            file_name = f"assessment_report_{uuid4()}.pdf"

            object_name = minio_client.upload_file(
                file_path=str(pdf_path),
                bucket_name=Config.MINIO_REPORTS_BUCKET,
                object_name=file_name,
                content_type="application/pdf",
            )

            download_url = minio_client.get_public_url(
                object_name, Config.MINIO_REPORTS_BUCKET
            )

            logger.info(f"[Job {job_id}] PDF uploaded: {download_url}")

            return {
                "job_id": job_id,
                "status": "completed",
                "file_url": download_url,
                "file_name": file_name,
                "object_name": object_name,
            }

    except Exception as e:
        logger.error(f"[Job {job_id}] PDF generation failed: {e}")
        raise


@app.task(bind=True, name="generate_compliance_pdf", time_limit=300)
def generate_compliance_pdf(
    self, compliance_data: Dict[str, Any], template: str = "default"
) -> Dict[str, str]:
    """
    Generate compliance report PDF.

    Args:
        compliance_data: Compliance check data
        template: Template name to use

    Returns:
        Job result with download URL
    """
    job_id = self.request.id
    logger.info(f"[Job {job_id}] Generating compliance PDF with template: {template}")

    # TODO: Implement template-based PDF generation
    # For now, use assessment PDF generator

    return generate_assessment_pdf(self, compliance_data)
