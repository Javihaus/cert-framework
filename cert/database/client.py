"""
Database client for storing traces and measurements.
Uses Supabase PostgreSQL.

Setup:
    1. Create Supabase project at https://supabase.com
    2. Run database/schema.sql in Supabase SQL Editor
    3. Set environment variables:
       export SUPABASE_URL="https://xxx.supabase.co"
       export SUPABASE_KEY="your-key-here"
"""

import os
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4


class DatabaseClient:
    """
    Client for interacting with traces database.

    Note: Requires supabase-py package.
    Install with: pip install supabase
    """

    def __init__(self, supabase_url: Optional[str] = None, supabase_key: Optional[str] = None):
        """
        Initialize database client.

        Args:
            supabase_url: Supabase project URL (or set SUPABASE_URL env var)
            supabase_key: Supabase API key (or set SUPABASE_KEY env var)

        Raises:
            ValueError: If credentials not provided
            ImportError: If supabase package not installed
        """
        try:
            from supabase import Client, create_client
        except ImportError:
            raise ImportError("Supabase package required. Install with: pip install supabase")

        url = supabase_url or os.getenv("SUPABASE_URL")
        key = supabase_key or os.getenv("SUPABASE_KEY")

        if not url or not key:
            raise ValueError(
                "Supabase credentials required. Either:\n"
                "1. Pass supabase_url and supabase_key to __init__, or\n"
                "2. Set SUPABASE_URL and SUPABASE_KEY environment variables\n"
                "\nGet credentials from: Supabase Dashboard → Settings → API"
            )

        self.client: Client = create_client(url, key)

    def insert_trace(
        self,
        function_name: str,
        duration_ms: float,
        status: str,
        input_text: Optional[str] = None,
        output_text: Optional[str] = None,
        context: Optional[str] = None,
        error_message: Optional[str] = None,
        metadata: Optional[Dict] = None,
        user_id: Optional[UUID] = None,
        project_id: Optional[UUID] = None,
    ) -> UUID:
        """
        Insert a trace into the database.

        Args:
            function_name: Name of the function being traced
            duration_ms: Execution time in milliseconds
            status: 'success' or 'error'
            input_text: Input to the function
            output_text: Output from the function
            context: Additional context (e.g., RAG context)
            error_message: Error message if status='error'
            metadata: Additional metadata as dict
            user_id: User who triggered the trace
            project_id: Project this trace belongs to

        Returns:
            UUID of inserted trace

        Example:
            >>> db = DatabaseClient()
            >>> trace_id = db.insert_trace(
            ...     function_name="my_rag_pipeline",
            ...     duration_ms=245.3,
            ...     status="success",
            ...     input_text="What is the capital of France?",
            ...     output_text="Paris is the capital of France.",
            ... )
        """
        trace_id = uuid4()

        data = {
            "id": str(trace_id),
            "function_name": function_name,
            "duration_ms": duration_ms,
            "status": status,
            "input_text": input_text,
            "output_text": output_text,
            "context": context,
            "error_message": error_message,
            "metadata": metadata or {},
        }

        if user_id:
            data["user_id"] = str(user_id)
        if project_id:
            data["project_id"] = str(project_id)

        response = self.client.table("traces").insert(data).execute()

        if not response.data:
            raise Exception(f"Failed to insert trace: {response}")

        return trace_id

    def insert_measurement(
        self,
        trace_id: UUID,
        confidence: float,
        semantic_score: float,
        grounding_score: float,
        threshold: float = 0.5,
    ) -> UUID:
        """
        Insert a measurement for a trace.

        Args:
            trace_id: ID of trace this measurement is for
            confidence: Overall confidence score (0-1)
            semantic_score: Semantic similarity score (0-1)
            grounding_score: Term grounding score (0-1)
            threshold: Pass/fail threshold used

        Returns:
            UUID of inserted measurement

        Example:
            >>> measurement_id = db.insert_measurement(
            ...     trace_id=trace_id,
            ...     confidence=0.85,
            ...     semantic_score=0.9,
            ...     grounding_score=0.8,
            ... )
        """
        measurement_id = uuid4()
        passed = confidence >= threshold

        data = {
            "id": str(measurement_id),
            "trace_id": str(trace_id),
            "confidence": confidence,
            "semantic_score": semantic_score,
            "grounding_score": grounding_score,
            "threshold": threshold,
            "passed": passed,
        }

        response = self.client.table("measurements").insert(data).execute()

        if not response.data:
            raise Exception(f"Failed to insert measurement: {response}")

        return measurement_id

    def get_traces(
        self,
        project_id: Optional[UUID] = None,
        status: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[Dict[str, Any]]:
        """
        Query traces with filters.

        Args:
            project_id: Filter by project
            status: Filter by status ('success' or 'error')
            limit: Max number of results (default 100)
            offset: Number of results to skip (for pagination)
            start_date: Only traces after this date
            end_date: Only traces before this date

        Returns:
            List of trace dictionaries

        Example:
            >>> # Get last 50 successful traces
            >>> traces = db.get_traces(status="success", limit=50)
            >>>
            >>> # Get failed traces from last week
            >>> from datetime import datetime, timedelta
            >>> week_ago = datetime.utcnow() - timedelta(days=7)
            >>> failed_traces = db.get_traces(
            ...     status="error",
            ...     start_date=week_ago
            ... )
        """
        query = self.client.table("traces").select("*")

        # Apply filters
        if project_id:
            query = query.eq("project_id", str(project_id))

        if status:
            query = query.eq("status", status)

        if start_date:
            query = query.gte("created_at", start_date.isoformat())

        if end_date:
            query = query.lte("created_at", end_date.isoformat())

        # Order by most recent first
        query = query.order("created_at", desc=True)

        # Pagination
        query = query.limit(limit).offset(offset)

        response = query.execute()
        return response.data

    def get_trace_with_measurement(self, trace_id: UUID) -> Dict[str, Any]:
        """
        Get a trace and its measurement (if exists).

        Returns:
            Dictionary with trace data and measurement data

        Raises:
            ValueError: If trace not found
        """
        # Get trace
        trace_response = self.client.table("traces").select("*").eq("id", str(trace_id)).execute()

        if not trace_response.data:
            raise ValueError(f"Trace not found: {trace_id}")

        trace = trace_response.data[0]

        # Get measurement
        measurement_response = (
            self.client.table("measurements").select("*").eq("trace_id", str(trace_id)).execute()
        )

        measurement = measurement_response.data[0] if measurement_response.data else None

        return {
            "trace": trace,
            "measurement": measurement,
        }

    def get_failed_traces(
        self,
        project_id: Optional[UUID] = None,
        confidence_threshold: float = 0.5,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Get traces that failed (either error status or low confidence).

        Useful for compliance reporting - Article 15 requires documenting failures.

        Returns:
            List of traces with their measurements
        """
        # Build query joining traces with measurements
        query = self.client.table("traces").select("*, measurements(*)")

        if project_id:
            query = query.eq("project_id", str(project_id))

        # Get all traces with measurements
        query = query.order("created_at", desc=True).limit(limit)
        response = query.execute()

        # Filter for failed ones
        failed = []
        for trace in response.data:
            # Failed if error status
            if trace["status"] == "error":
                failed.append(trace)
                continue

            # Or if low confidence
            measurements = trace.get("measurements", [])
            if measurements:
                measurement = measurements[0]
                if measurement["confidence"] < confidence_threshold:
                    failed.append(trace)

        return failed

    def insert_compliance_check(
        self,
        project_id: UUID,
        period_start: datetime,
        period_end: datetime,
        article_15_compliant: bool,
        article_15_issues: List[str],
        annex_iv_complete: bool,
        annex_iv_missing: List[str],
        overall_compliant: bool,
        risk_score: float,
        report_data: Dict[str, Any],
        error_rate: Optional[float] = None,
        avg_response_time_ms: Optional[float] = None,
        accuracy_score: Optional[float] = None,
    ) -> UUID:
        """
        Store a compliance check result.

        Args:
            project_id: Project this check is for
            period_start: Start of analyzed period
            period_end: End of analyzed period
            article_15_compliant: Article 15 compliance status
            article_15_issues: List of Article 15 issues found
            annex_iv_complete: Annex IV completeness status
            annex_iv_missing: List of missing Annex IV sections
            overall_compliant: Overall compliance status
            risk_score: Risk score (0.0-1.0)
            report_data: Full report data as dict
            error_rate: Optional error rate
            avg_response_time_ms: Optional avg response time
            accuracy_score: Optional accuracy score

        Returns:
            UUID of inserted compliance check
        """
        check_id = uuid4()

        data = {
            "id": str(check_id),
            "project_id": str(project_id),
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat(),
            "article_15_compliant": article_15_compliant,
            "article_15_issues": article_15_issues,
            "annex_iv_complete": annex_iv_complete,
            "annex_iv_missing": annex_iv_missing,
            "overall_compliant": overall_compliant,
            "risk_score": risk_score,
            "report_data": report_data,
            "error_rate": error_rate,
            "avg_response_time_ms": avg_response_time_ms,
            "accuracy_score": accuracy_score,
        }

        response = self.client.table("compliance_checks").insert(data).execute()

        if not response.data:
            raise Exception(f"Failed to insert compliance check: {response}")

        return check_id
