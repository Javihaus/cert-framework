"""
CERT API Server
===============

FastAPI server providing real-time access to CERT framework data
for self-hosted dashboard integration.
"""

import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from cert.core.tracer import CertTracer
from cert.integrations.registry import (
    check_connector_health,
    get_active_connectors,
    get_connector_status,
)
from cert.metrics.engine import MetricsEngine
from cert.metrics.config import MetricConfig
from cert.value.analyzer import CostAnalyzer
from cert.value.optimizer import Optimizer

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="CERT API",
    description="Real-time API for CERT Framework monitoring and analytics",
    version="4.0.0",
)

# CORS middleware for dashboard access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
_tracer: Optional[CertTracer] = None
_trace_file = Path("cert_traces.jsonl")


def get_tracer() -> CertTracer:
    """Get or create the global tracer instance."""
    global _tracer
    if _tracer is None:
        _tracer = CertTracer()
    return _tracer


@app.get("/")
def root():
    """API root endpoint."""
    return {
        "name": "CERT API",
        "version": "4.0.0",
        "status": "running",
        "endpoints": [
            "/api/metrics",
            "/api/metrics/summary",
            "/api/metrics/cost",
            "/api/metrics/health",
            "/api/metrics/quality",
            "/api/metrics/config",
            "/api/connectors/status",
            "/api/connectors/health",
            "/api/costs/summary",
            "/api/costs/trend",
            "/api/optimization/recommendations",
            "/api/traces/recent",
        ],
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


# Global metrics engine instance
_metrics_engine: Optional[MetricsEngine] = None
_metrics_config: Optional[MetricConfig] = None


def get_metrics_engine() -> MetricsEngine:
    """Get or create the global metrics engine instance."""
    global _metrics_engine, _metrics_config
    if _metrics_engine is None:
        _metrics_config = _metrics_config or MetricConfig.default()
        _metrics_engine = MetricsEngine(str(_trace_file), _metrics_config)
    return _metrics_engine


# Metrics endpoints - Primary dashboard API
@app.get("/api/metrics")
def get_metrics(time_window: str = "week"):
    """
    Get all three primary metrics (Cost, Health, Quality).

    This is the primary endpoint for the dashboard overview.

    Args:
        time_window: Time window for metrics (hour, day, week, month)

    Returns:
        Complete metrics snapshot with cost, health, and quality
    """
    try:
        engine = get_metrics_engine()
        engine.reload_traces()  # Ensure fresh data
        metrics = engine.get_metrics(time_window)
        return metrics.to_dict()
    except Exception as e:
        logger.error(f"Failed to get metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics/summary")
def get_metrics_summary(time_window: str = "week"):
    """
    Get simplified metrics summary for quick dashboard display.

    Returns display-ready strings with trend indicators.
    """
    try:
        engine = get_metrics_engine()
        engine.reload_traces()
        return engine.get_metrics_summary(time_window)
    except Exception as e:
        logger.error(f"Failed to get metrics summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics/cost")
def get_cost_metric(time_window: str = "week"):
    """
    Get detailed cost metric.

    Includes breakdown by model and platform.
    """
    try:
        engine = get_metrics_engine()
        engine.reload_traces()
        return engine.cost_metric(time_window).to_dict()
    except Exception as e:
        logger.error(f"Failed to get cost metric: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics/health")
def get_health_metric(time_window: str = "week"):
    """
    Get detailed health metric.

    Includes error rate, latency stats, and issues.
    """
    try:
        engine = get_metrics_engine()
        engine.reload_traces()
        return engine.health_metric(time_window).to_dict()
    except Exception as e:
        logger.error(f"Failed to get health metric: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics/quality")
def get_quality_metric(time_window: str = "week"):
    """
    Get detailed quality metric.

    Includes evaluation method and accuracy breakdown.
    """
    try:
        engine = get_metrics_engine()
        engine.reload_traces()
        return engine.quality_metric(time_window).to_dict()
    except Exception as e:
        logger.error(f"Failed to get quality metric: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics/config")
def get_metrics_config():
    """Get current metrics configuration."""
    try:
        global _metrics_config
        if _metrics_config is None:
            _metrics_config = MetricConfig.default()
        return _metrics_config.to_dict()
    except Exception as e:
        logger.error(f"Failed to get metrics config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class MetricConfigUpdate(BaseModel):
    """Model for metrics configuration update."""

    cost: Optional[Dict[str, Any]] = None
    health: Optional[Dict[str, Any]] = None
    quality: Optional[Dict[str, Any]] = None
    default_time_window: Optional[str] = None


@app.put("/api/metrics/config")
def update_metrics_config(update: MetricConfigUpdate):
    """Update metrics configuration."""
    try:
        global _metrics_config, _metrics_engine

        current_config = _metrics_config or MetricConfig.default()
        config_dict = current_config.to_dict()

        # Apply updates
        if update.cost:
            config_dict["cost"].update(update.cost)
        if update.health:
            config_dict["health"].update(update.health)
        if update.quality:
            config_dict["quality"].update(update.quality)
        if update.default_time_window:
            config_dict["default_time_window"] = update.default_time_window

        # Create new config and reset engine
        _metrics_config = MetricConfig.from_dict(config_dict)
        _metrics_engine = None  # Will be recreated on next request

        return {"success": True, "config": _metrics_config.to_dict()}
    except Exception as e:
        logger.error(f"Failed to update metrics config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Connector endpoints
@app.get("/api/connectors/status")
def get_connectors_status():
    """Get status of all registered connectors."""
    try:
        status = get_connector_status()
        connectors = []

        for name, info in status.items():
            connectors.append(
                {
                    "name": name,
                    "status": "active" if info.get("enabled") else "disabled",
                    "trace_count": info.get("trace_count", 0),
                    "failure_count": info.get("failure_count", 0),
                    "last_activity": info.get("last_activity"),
                    "description": info.get("description", ""),
                    "platform": name.lower(),
                }
            )

        return {"connectors": connectors}
    except Exception as e:
        logger.error(f"Failed to get connector status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/connectors/health")
def get_connectors_health():
    """Get health status of all connectors."""
    try:
        health = check_connector_health()
        active = get_active_connectors()

        return {
            "overall_health": health,
            "active_count": len(active),
            "active_connectors": active,
        }
    except Exception as e:
        logger.error(f"Failed to get connector health: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Cost analysis endpoints
@app.get("/api/costs/summary")
def get_cost_summary(days: int = 30):
    """Get cost summary for the specified number of days."""
    try:
        if not _trace_file.exists():
            return {
                "total_cost": 0,
                "daily_costs": [],
                "by_model": {},
                "by_platform": {},
            }

        analyzer = CostAnalyzer(str(_trace_file))

        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        return {
            "total_cost": analyzer.total_cost(start_date, end_date),
            "daily_costs": analyzer.cost_trend("daily", start_date, end_date),
            "by_model": analyzer.cost_by_model(start_date, end_date),
            "by_platform": analyzer.cost_by_platform(start_date, end_date),
        }
    except Exception as e:
        logger.error(f"Failed to get cost summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/costs/trend")
def get_cost_trend(period: str = "daily", days: int = 30):
    """Get cost trend over time."""
    try:
        if not _trace_file.exists():
            return {"trend": []}

        analyzer = CostAnalyzer(str(_trace_file))

        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        trend = analyzer.cost_trend(period, start_date, end_date)

        return {"trend": trend, "period": period, "days": days}
    except Exception as e:
        logger.error(f"Failed to get cost trend: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Optimization endpoints
@app.get("/api/optimization/recommendations")
def get_recommendations():
    """Get optimization recommendations."""
    try:
        if not _trace_file.exists():
            return {"recommendations": []}

        optimizer = Optimizer(str(_trace_file))

        recommendations = []

        # Model downgrade recommendations
        model_recs = optimizer.recommend_model_changes()
        for rec in model_recs:
            recommendations.append(
                {
                    "type": "model_downgrade",
                    "description": f"Downgrade {rec['task_type']} from {rec['current_model']} to {rec['suggested_model']}",
                    "details": f"Based on {rec['sample_size']} samples with {rec['avg_confidence'] * 100:.1f}% average confidence",
                    "potential_savings": rec["potential_savings"],
                    "impact": "high" if rec["potential_savings"] > 50 else "medium",
                }
            )

        # Caching recommendations
        caching_recs = optimizer.find_caching_opportunities()
        for rec in caching_recs:
            recommendations.append(
                {
                    "type": "caching",
                    "description": "Cache responses for repeated prompt pattern",
                    "details": f"Pattern appears {rec['count']} times. Implement caching to save on redundant calls.",
                    "potential_savings": rec["potential_savings"],
                    "impact": "high" if rec["count"] > 20 else "medium",
                }
            )

        # Prompt optimization
        prompt_recs = optimizer.suggest_prompt_optimizations()
        for rec in prompt_recs:
            recommendations.append(
                {
                    "type": "prompt_optimization",
                    "description": "Optimize long prompts to reduce token usage",
                    "details": f"{rec['count']} prompts exceed {rec['threshold']} tokens",
                    "potential_savings": rec["potential_savings"],
                    "impact": "medium",
                }
            )

        # Sort by savings
        recommendations.sort(key=lambda x: x["potential_savings"], reverse=True)

        return {"recommendations": recommendations, "count": len(recommendations)}
    except Exception as e:
        logger.error(f"Failed to get recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Trace endpoints
@app.get("/api/traces/recent")
def get_recent_traces(limit: int = 100):
    """Get recent traces."""
    try:
        if not _trace_file.exists():
            return {"traces": [], "count": 0}

        traces = []
        with open(_trace_file) as f:
            for line in f:
                if line.strip():
                    traces.append(json.loads(line))

        # Return most recent traces
        recent = traces[-limit:] if len(traces) > limit else traces
        recent.reverse()  # Most recent first

        return {"traces": recent, "count": len(recent), "total": len(traces)}
    except Exception as e:
        logger.error(f"Failed to get recent traces: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Assessment endpoints (for lead capture)
class AssessmentSubmission(BaseModel):
    """Model for assessment submission."""

    answers: Dict[str, str]
    report: Dict[str, Any]
    email: Optional[str] = None
    company: Optional[str] = None


@app.post("/api/assessment/submit")
def submit_assessment(submission: AssessmentSubmission):
    """Submit assessment results for lead tracking."""
    try:
        # Log the submission
        logger.info(
            f"Assessment submitted: risk_level={submission.report.get('riskLevel')}, email={submission.email}"
        )

        # TODO: Store in database, send to CRM, email report, etc.
        # For now, just acknowledge receipt

        return {
            "success": True,
            "message": "Assessment received. Report will be sent to your email.",
        }
    except Exception as e:
        logger.error(f"Failed to submit assessment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
