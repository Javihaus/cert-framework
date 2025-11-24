"""
Document Generation Tasks
========================

Celery tasks for asynchronous compliance document generation.
"""

import json
import logging
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Any, Dict
from uuid import uuid4
import zipfile

from celery import Task
from backend.celery_app import app
from backend.config import Config
from backend.storage.minio_client import get_minio_client

logger = logging.getLogger(__name__)


class DocumentGenerationTask(Task):
    """Base task for document generation with error handling."""

    autoretry_for = (Exception,)
    retry_kwargs = {"max_retries": 3}
    retry_backoff = True


@app.task(
    bind=True,
    base=DocumentGenerationTask,
    name="generate_compliance_documents",
    time_limit=600,
)
def generate_compliance_documents(
    self, risk_data: Dict[str, Any], compliance_data: Dict[str, Any]
) -> Dict[str, str]:
    """
    Generate compliance documents from risk and compliance data.

    This task:
    1. Creates temporary directory
    2. Writes JSON data files
    3. Runs Python script to populate Word templates
    4. Creates ZIP archive
    5. Uploads to MinIO
    6. Returns download URL

    Args:
        risk_data: Risk assessment data
        compliance_data: Compliance analysis data

    Returns:
        Dict with keys:
        - job_id: Task ID
        - status: 'completed'
        - file_url: MinIO download URL
        - file_name: Name of ZIP file

    Raises:
        Exception: If document generation fails
    """
    job_id = self.request.id
    logger.info(f"[Job {job_id}] Starting document generation")

    # Create temporary directory
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        logger.info(f"[Job {job_id}] Created temp directory: {temp_path}")

        try:
            # Write JSON data files
            risk_path = temp_path / "risk.json"
            compliance_path = temp_path / "compliance.json"

            with open(risk_path, "w") as f:
                json.dump(risk_data, f, indent=2)

            with open(compliance_path, "w") as f:
                json.dump(compliance_data, f, indent=2)

            logger.info(f"[Job {job_id}] Wrote JSON data files")

            # Output directory for generated documents
            output_dir = temp_path / "documents"
            output_dir.mkdir()

            # Path to Python script
            script_path = Path(Config.SCRIPTS_DIR) / "populate_templates.py"

            if not script_path.exists():
                raise FileNotFoundError(f"Template script not found: {script_path}")

            logger.info(f"[Job {job_id}] Running populate_templates.py")

            # Run document generation script
            result = subprocess.run(
                [
                    "python3",
                    str(script_path),
                    str(risk_path),
                    str(compliance_path),
                    "--output",
                    str(output_dir),
                ],
                capture_output=True,
                text=True,
                timeout=300,  # 5 minute timeout
            )

            if result.returncode != 0:
                logger.error(f"[Job {job_id}] Script failed: {result.stderr}")
                raise Exception(f"Document generation failed: {result.stderr}")

            logger.info(f"[Job {job_id}] Documents generated successfully")

            # Create ZIP archive
            zip_path = temp_path / "compliance_package.zip"

            with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
                for file_path in output_dir.iterdir():
                    if file_path.is_file():
                        zipf.write(file_path, file_path.name)

            logger.info(f"[Job {job_id}] Created ZIP archive: {zip_path.stat().st_size} bytes")

            # Upload to MinIO
            minio_client = get_minio_client()

            # Generate unique file name
            file_name = f"compliance_package_{job_id[:8]}.zip"

            object_name = minio_client.upload_file(
                file_path=str(zip_path),
                bucket_name=Config.MINIO_BUCKET,
                object_name=file_name,
                content_type="application/zip",
            )

            # Get public download URL
            download_url = minio_client.get_public_url(object_name, Config.MINIO_BUCKET)

            logger.info(f"[Job {job_id}] Upload complete: {download_url}")

            return {
                "job_id": job_id,
                "status": "completed",
                "file_url": download_url,
                "file_name": file_name,
                "object_name": object_name,
            }

        except Exception as e:
            logger.error(f"[Job {job_id}] Document generation failed: {e}")
            raise


@app.task(bind=True, name="generate_custom_documents", time_limit=600)
def generate_custom_documents(
    self, system_data: Dict[str, Any], document_types: list[str]
) -> Dict[str, str]:
    """
    Generate custom document selection.

    Args:
        system_data: System metadata
        document_types: List of document type IDs to generate

    Returns:
        Job result with download URL
    """
    job_id = self.request.id
    logger.info(f"[Job {job_id}] Generating custom documents: {document_types}")

    # TODO: Implement custom document generation logic
    # For now, delegate to full compliance generation

    return generate_compliance_documents(
        self,
        risk_data={"metadata": system_data, "classification": {}},
        compliance_data={"metadata": system_data},
    )
