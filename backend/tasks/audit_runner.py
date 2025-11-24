"""
Audit Runner Tasks
=================

Celery tasks for asynchronous accuracy testing and compliance audits.
"""

import json
import logging
import subprocess
import tempfile
from pathlib import Path
from typing import Any, Dict

from celery import Task
from backend.celery_app import app
from backend.config import Config

logger = logging.getLogger(__name__)


class AuditTask(Task):
    """Base task for audit execution with error handling."""

    autoretry_for = (Exception,)
    retry_kwargs = {"max_retries": 2}
    retry_backoff = True


@app.task(bind=True, base=AuditTask, name="run_accuracy_audit", time_limit=300)
def run_accuracy_audit(
    self, traces_data: str, threshold: float = 0.7, evaluator: str = "semantic"
) -> Dict[str, Any]:
    """
    Run accuracy audit on traces data.

    This task:
    1. Writes traces to temporary file
    2. Runs CERT audit CLI command
    3. Parses results
    4. Returns formatted audit report

    Args:
        traces_data: JSONL-formatted traces
        threshold: Accuracy threshold (0-1)
        evaluator: Evaluator type ('semantic' or 'exact')

    Returns:
        Dict with audit results:
        - total_traces: Total number of traces
        - passed_traces: Number of passing traces
        - failed_traces: Number of failing traces
        - pass_rate: Pass rate (0-1)
        - compliant: Whether system is compliant
        - results: List of individual trace results

    Raises:
        Exception: If audit execution fails
    """
    job_id = self.request.id
    logger.info(
        f"[Job {job_id}] Starting audit: evaluator={evaluator}, threshold={threshold}"
    )

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)

        try:
            # Write traces to file
            traces_path = temp_path / "traces.jsonl"
            with open(traces_path, "w") as f:
                f.write(traces_data)

            logger.info(f"[Job {job_id}] Wrote traces file: {traces_path}")

            # Output path for results
            results_path = temp_path / "audit_results.json"

            # Run CERT audit command
            logger.info(f"[Job {job_id}] Running audit...")

            result = subprocess.run(
                [
                    "python3",
                    "-m",
                    "cert.cli.main",
                    "audit",
                    str(traces_path),
                    "--format",
                    "json",
                    "--output",
                    str(results_path),
                    "--threshold",
                    str(threshold),
                    "--evaluator",
                    evaluator,
                ],
                capture_output=True,
                text=True,
                timeout=180,  # 3 minute timeout
            )

            if result.returncode != 0:
                logger.error(f"[Job {job_id}] Audit failed: {result.stderr}")
                raise Exception(f"Audit execution failed: {result.stderr}")

            logger.info(f"[Job {job_id}] Audit completed successfully")

            # Read results
            with open(results_path, "r") as f:
                audit_results = json.load(f)

            # Format response
            article_15 = audit_results.get("article_15", {})

            response = {
                "job_id": job_id,
                "status": "completed",
                "total_traces": article_15.get("total_traces", 0),
                "passed_traces": article_15.get("passed_traces", 0),
                "failed_traces": article_15.get("failed_traces", 0),
                "pass_rate": article_15.get("accuracy", 0.0),
                "threshold": threshold,
                "evaluator_type": article_15.get("evaluator_type", evaluator),
                "compliant": article_15.get("compliant", False),
                "results": audit_results.get("traces", []),
            }

            logger.info(
                f"[Job {job_id}] Audit complete: {response['passed_traces']}/{response['total_traces']} passed"
            )

            return response

        except Exception as e:
            logger.error(f"[Job {job_id}] Audit failed: {e}")
            raise


@app.task(bind=True, name="run_compliance_check", time_limit=600)
def run_compliance_check(self, project_id: str, traces_data: str) -> Dict[str, Any]:
    """
    Run full compliance check (Article 15 + Annex IV).

    Args:
        project_id: Project UUID
        traces_data: JSONL-formatted traces

    Returns:
        Full compliance report
    """
    job_id = self.request.id
    logger.info(f"[Job {job_id}] Running compliance check for project: {project_id}")

    # TODO: Implement full compliance checking
    # For now, run accuracy audit

    return run_accuracy_audit(self, traces_data, threshold=0.9, evaluator="semantic")
