"""Automatic audit trail for EU AI Act Article 19 compliance.

Logs all LLM requests with accuracy metrics for regulatory audit.
"""

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

logger = logging.getLogger(__name__)


class AuditLogger:
    """Automatic audit trail logger for EU AI Act compliance.

    Logs all monitored requests to JSONL file for Article 19 compliance.
    Minimum retention: 6 months (configurable by industry).
    """

    def __init__(self, log_path: str = "cert_audit.jsonl"):
        """Initialize audit logger.

        Args:
            log_path: Path to audit log file (default: cert_audit.jsonl)
        """
        self.log_path = Path(log_path)
        self._ensure_log_file()

        logger.info(f"Audit logger initialized: {self.log_path}")

    def _ensure_log_file(self):
        """Ensure log file exists and is writable."""
        self.log_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.log_path.exists():
            self.log_path.touch()
            self._write_header()

    def _write_header(self):
        """Write header to new audit log."""
        header = {
            "type": "header",
            "version": "2.0",
            "framework": "CERT",
            "purpose": "EU AI Act Article 15 & 19 Compliance Audit Trail",
            "created_at": datetime.now().isoformat(),
        }
        self._append_log(header)

    def _append_log(self, entry: Dict[str, Any]):
        """Append entry to audit log."""
        with self.log_path.open("a") as f:
            f.write(json.dumps(entry) + "\n")

    def log_request(
        self,
        function_name: str,
        context: str,
        answer: str,
        accuracy_score: float,
        hallucination_detected: bool,
        is_compliant: bool,
        metrics: Dict[str, Any],
        timestamp: str,
        duration_ms: float,
    ):
        """Log monitored request to audit trail.

        Args:
            function_name: Name of monitored function
            context: Context provided to model
            answer: Model's answer
            accuracy_score: Overall accuracy score
            hallucination_detected: Whether hallucination was detected
            is_compliant: Whether request meets compliance threshold
            metrics: Detailed metrics (semantic, NLI, grounding)
            timestamp: ISO timestamp of request
            duration_ms: Request duration in milliseconds
        """
        entry = {
            "type": "request",
            "timestamp": timestamp,
            "function": function_name,
            "accuracy_score": round(accuracy_score, 4),
            "hallucination_detected": hallucination_detected,
            "is_compliant": is_compliant,
            "metrics": {
                "semantic_score": round(metrics["semantic_score"], 4),
                "nli_score": round(metrics["nli_score"], 4),
                "grounding_score": round(metrics["grounding_score"], 4),
                "is_contradiction": metrics["is_contradiction"],
                "ungrounded_terms_count": metrics["ungrounded_terms_count"],
            },
            "duration_ms": round(duration_ms, 2),
            "context_length": len(context),
            "answer_length": len(answer),
        }

        self._append_log(entry)

    def log_error(self, function_name: str, error: str, timestamp: str):
        """Log error to audit trail.

        Args:
            function_name: Name of function that errored
            error: Error message
            timestamp: ISO timestamp of error
        """
        entry = {
            "type": "error",
            "timestamp": timestamp,
            "function": function_name,
            "error": error,
        }

        self._append_log(entry)

    def get_statistics(self) -> Dict[str, Any]:
        """Get summary statistics from audit log.

        Returns:
            Dictionary with total_requests, hallucination_rate, compliance_rate,
            mean_accuracy, etc.
        """
        total_requests = 0
        total_hallucinations = 0
        total_compliant = 0
        accuracy_scores = []

        with self.log_path.open("r") as f:
            for line in f:
                try:
                    entry = json.loads(line)
                    if entry.get("type") == "request":
                        total_requests += 1
                        if entry.get("hallucination_detected"):
                            total_hallucinations += 1
                        if entry.get("is_compliant"):
                            total_compliant += 1
                        accuracy_scores.append(entry.get("accuracy_score", 0.0))
                except json.JSONDecodeError:
                    continue

        if total_requests == 0:
            return {
                "total_requests": 0,
                "hallucination_rate": 0.0,
                "compliance_rate": 0.0,
                "mean_accuracy": 0.0,
            }

        return {
            "total_requests": total_requests,
            "hallucination_rate": total_hallucinations / total_requests,
            "compliance_rate": total_compliant / total_requests,
            "mean_accuracy": sum(accuracy_scores) / len(accuracy_scores)
            if accuracy_scores
            else 0.0,
        }
