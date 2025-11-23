"""
Example 4: Agentic Pipeline with LangChain + CERT Monitoring
=============================================================

This example demonstrates how to build a multi-agent pipeline using LangChain
with CERT framework monitoring for cost tracking, latency monitoring, and
compliance documentation.

Pipeline:
    Agent 1 (Research Agent) -> Agent 2 (Analysis Agent) -> Final Report

Requirements:
    pip install cert-framework[langchain,anthropic]
    export ANTHROPIC_API_KEY=your-key-here

Usage:
    python examples/04_agentic_pipeline.py
"""

import json
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, asdict

# CERT Framework - Core tracing (zero dependencies)
from cert import trace
from cert.core.tracer import CertTracer

# Try to import LangChain and Anthropic
try:
    from langchain_anthropic import ChatAnthropic
    from langchain_core.messages import HumanMessage, SystemMessage
    from langchain_core.callbacks import BaseCallbackHandler

    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    print("Warning: LangChain/Anthropic not installed.")
    print("Install with: pip install langchain-anthropic langchain-core")


# ============================================================================
# Data Models
# ============================================================================

@dataclass
class ResearchResult:
    """Output from the Research Agent."""
    topic: str
    findings: List[str]
    sources: List[str]
    confidence: float
    timestamp: str


@dataclass
class AnalysisResult:
    """Output from the Analysis Agent."""
    summary: str
    key_insights: List[str]
    recommendations: List[str]
    risk_factors: List[str]
    timestamp: str


# ============================================================================
# CERT Callback Handler for LangChain
# ============================================================================

class CERTLangChainCallback(BaseCallbackHandler):
    """
    Callback handler that logs LangChain LLM calls to CERT traces.

    This enables automatic cost tracking, latency monitoring, and
    compliance documentation for all LLM calls in your pipeline.
    """

    def __init__(self, log_path: str = "cert_traces.jsonl"):
        super().__init__()
        self.tracer = CertTracer(log_path)
        self.active_calls: Dict[str, Dict] = {}
        self.metrics = {
            "total_calls": 0,
            "total_latency_ms": 0,
            "total_input_tokens": 0,
            "total_output_tokens": 0,
            "errors": 0
        }

    def on_llm_start(self, serialized: Dict, prompts: List[str], **kwargs) -> None:
        """Called when LLM starts processing."""
        run_id = str(kwargs.get("run_id", "unknown"))
        self.active_calls[run_id] = {
            "start_time": time.time(),
            "prompts": prompts,
            "model": serialized.get("kwargs", {}).get("model", "unknown")
        }
        self.metrics["total_calls"] += 1

    def on_llm_end(self, response, **kwargs) -> None:
        """Called when LLM finishes - logs to CERT tracer."""
        run_id = str(kwargs.get("run_id", "unknown"))

        if run_id not in self.active_calls:
            return

        call_data = self.active_calls.pop(run_id)
        latency_ms = (time.time() - call_data["start_time"]) * 1000
        self.metrics["total_latency_ms"] += latency_ms

        # Extract token usage
        input_tokens = 0
        output_tokens = 0
        if hasattr(response, "llm_output") and response.llm_output:
            usage = response.llm_output.get("usage", {})
            input_tokens = usage.get("input_tokens", 0)
            output_tokens = usage.get("output_tokens", 0)
            self.metrics["total_input_tokens"] += input_tokens
            self.metrics["total_output_tokens"] += output_tokens

        # Extract output text
        output_text = ""
        if hasattr(response, "generations") and response.generations:
            if len(response.generations) > 0 and len(response.generations[0]) > 0:
                output_text = response.generations[0][0].text

        # Log to CERT tracer
        trace_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "platform": "langchain-anthropic",
            "model": call_data["model"],
            "input_preview": call_data["prompts"][0][:200] if call_data["prompts"] else "",
            "output_preview": output_text[:200],
            "latency_ms": round(latency_ms, 2),
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "status": "success"
        }
        self.tracer.log_trace(trace_data)

    def on_llm_error(self, error, **kwargs) -> None:
        """Called when LLM errors."""
        self.metrics["errors"] += 1
        run_id = str(kwargs.get("run_id", "unknown"))

        if run_id in self.active_calls:
            call_data = self.active_calls.pop(run_id)
            latency_ms = (time.time() - call_data["start_time"]) * 1000

            trace_data = {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "platform": "langchain-anthropic",
                "model": call_data.get("model", "unknown"),
                "latency_ms": round(latency_ms, 2),
                "status": "error",
                "error": str(error)
            }
            self.tracer.log_trace(trace_data)

    def get_metrics(self) -> Dict[str, Any]:
        """Get aggregated metrics for the pipeline."""
        avg_latency = 0
        if self.metrics["total_calls"] > 0:
            avg_latency = self.metrics["total_latency_ms"] / self.metrics["total_calls"]

        return {
            **self.metrics,
            "average_latency_ms": round(avg_latency, 2)
        }


# ============================================================================
# Agent 1: Research Agent
# ============================================================================

class ResearchAgent:
    """
    Agent that researches a topic and extracts key findings.

    Uses Claude to analyze information and extract structured data.
    All calls are traced with CERT for monitoring.
    """

    RESEARCH_PROMPT = """You are a research analyst. Research the following topic and provide:

TOPIC: {topic}

Provide your response in JSON format:
{{
    "findings": ["finding 1", "finding 2", "finding 3", ...],
    "sources": ["source type 1", "source type 2", ...],
    "confidence": 0.0-1.0
}}

Be thorough but concise. Return ONLY valid JSON."""

    def __init__(self, model: str = "claude-sonnet-4-20250514", callback: Optional[BaseCallbackHandler] = None):
        self.model = model
        self.callback = callback
        if LANGCHAIN_AVAILABLE:
            self.llm = ChatAnthropic(
                model=model,
                max_tokens=2048,
                callbacks=[callback] if callback else None
            )
        self.tracer = CertTracer("research_agent_traces.jsonl")

    @trace(log_path="research_agent_traces.jsonl", metadata={"agent": "research"})
    def research(self, topic: str) -> ResearchResult:
        """Research a topic and return structured findings."""
        if not LANGCHAIN_AVAILABLE:
            return self._mock_research(topic)

        print(f"  [Research Agent] Researching: {topic}")

        messages = [
            SystemMessage(content="You are an expert research analyst."),
            HumanMessage(content=self.RESEARCH_PROMPT.format(topic=topic))
        ]

        response = self.llm.invoke(messages)

        try:
            # Parse JSON response
            response_text = response.content
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]

            parsed = json.loads(response_text.strip())
        except json.JSONDecodeError:
            parsed = {
                "findings": [response.content[:500]],
                "sources": ["LLM analysis"],
                "confidence": 0.5
            }

        return ResearchResult(
            topic=topic,
            findings=parsed.get("findings", []),
            sources=parsed.get("sources", []),
            confidence=parsed.get("confidence", 0.7),
            timestamp=datetime.utcnow().isoformat() + "Z"
        )

    def _mock_research(self, topic: str) -> ResearchResult:
        """Mock research for testing without API."""
        return ResearchResult(
            topic=topic,
            findings=[
                f"Key finding 1 about {topic}",
                f"Key finding 2 about {topic}",
                f"Key finding 3 about {topic}"
            ],
            sources=["Industry reports", "Academic papers", "Expert interviews"],
            confidence=0.85,
            timestamp=datetime.utcnow().isoformat() + "Z"
        )


# ============================================================================
# Agent 2: Analysis Agent
# ============================================================================

class AnalysisAgent:
    """
    Agent that analyzes research findings and generates insights.

    Takes input from the Research Agent and produces actionable analysis.
    """

    ANALYSIS_PROMPT = """You are a senior analyst. Based on the research findings below, provide strategic analysis.

TOPIC: {topic}
FINDINGS: {findings}
SOURCES: {sources}
RESEARCH CONFIDENCE: {confidence}

Provide your analysis in JSON format:
{{
    "summary": "2-3 sentence executive summary",
    "key_insights": ["insight 1", "insight 2", "insight 3"],
    "recommendations": ["recommendation 1", "recommendation 2"],
    "risk_factors": ["risk 1", "risk 2"]
}}

Return ONLY valid JSON."""

    def __init__(self, model: str = "claude-sonnet-4-20250514", callback: Optional[BaseCallbackHandler] = None):
        self.model = model
        self.callback = callback
        if LANGCHAIN_AVAILABLE:
            self.llm = ChatAnthropic(
                model=model,
                max_tokens=2048,
                callbacks=[callback] if callback else None
            )
        self.tracer = CertTracer("analysis_agent_traces.jsonl")

    @trace(log_path="analysis_agent_traces.jsonl", metadata={"agent": "analysis"})
    def analyze(self, research: ResearchResult) -> AnalysisResult:
        """Analyze research findings and generate insights."""
        if not LANGCHAIN_AVAILABLE:
            return self._mock_analyze(research)

        print(f"  [Analysis Agent] Analyzing findings for: {research.topic}")

        messages = [
            SystemMessage(content="You are an expert strategic analyst."),
            HumanMessage(content=self.ANALYSIS_PROMPT.format(
                topic=research.topic,
                findings=json.dumps(research.findings),
                sources=", ".join(research.sources),
                confidence=research.confidence
            ))
        ]

        response = self.llm.invoke(messages)

        try:
            response_text = response.content
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]

            parsed = json.loads(response_text.strip())
        except json.JSONDecodeError:
            parsed = {
                "summary": response.content[:500],
                "key_insights": ["Analysis parsing failed"],
                "recommendations": ["Review manually"],
                "risk_factors": ["Unknown"]
            }

        return AnalysisResult(
            summary=parsed.get("summary", ""),
            key_insights=parsed.get("key_insights", []),
            recommendations=parsed.get("recommendations", []),
            risk_factors=parsed.get("risk_factors", []),
            timestamp=datetime.utcnow().isoformat() + "Z"
        )

    def _mock_analyze(self, research: ResearchResult) -> AnalysisResult:
        """Mock analysis for testing without API."""
        return AnalysisResult(
            summary=f"Analysis of {research.topic} reveals significant opportunities.",
            key_insights=[
                "Market conditions favor early movers",
                "Technology adoption is accelerating",
                "Competitive landscape is shifting"
            ],
            recommendations=[
                "Prioritize investment in core capabilities",
                "Monitor competitor activities closely"
            ],
            risk_factors=[
                "Market volatility remains high",
                "Regulatory uncertainty"
            ],
            timestamp=datetime.utcnow().isoformat() + "Z"
        )


# ============================================================================
# Pipeline Orchestrator
# ============================================================================

class ResearchPipeline:
    """
    Orchestrates the multi-agent research and analysis pipeline.

    Pipeline flow:
        Topic -> Research Agent -> Analysis Agent -> Final Report

    All steps are monitored with CERT framework for:
    - Cost tracking
    - Latency monitoring
    - EU AI Act compliance documentation
    """

    def __init__(self, model: str = "claude-sonnet-4-20250514"):
        self.model = model
        self.pipeline_tracer = CertTracer("pipeline_traces.jsonl")

        # Create shared callback for all agents
        self.callback = CERTLangChainCallback(log_path="cert_traces.jsonl")

        # Initialize agents
        self.research_agent = ResearchAgent(model=model, callback=self.callback)
        self.analysis_agent = AnalysisAgent(model=model, callback=self.callback)

        print(f"Pipeline initialized with model: {model}")
        print("CERT monitoring enabled - traces logged to cert_traces.jsonl")

    @trace(log_path="pipeline_traces.jsonl", metadata={"component": "orchestrator"})
    def run(self, topic: str) -> Dict[str, Any]:
        """
        Run the full research and analysis pipeline.

        Args:
            topic: Topic to research and analyze

        Returns:
            Dictionary with research, analysis, and pipeline metrics
        """
        pipeline_start = time.time()

        print(f"\n{'=' * 60}")
        print(f"RESEARCH PIPELINE: {topic}")
        print(f"{'=' * 60}")

        # Log pipeline start
        self.pipeline_tracer.log_trace({
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event": "pipeline_start",
            "topic": topic
        })

        # Step 1: Research
        print("\n[STEP 1] Running Research Agent...")
        research_start = time.time()
        research_result = self.research_agent.research(topic)
        research_time = time.time() - research_start

        print(f"  -> Found {len(research_result.findings)} findings")
        print(f"  -> Confidence: {research_result.confidence:.2f}")

        # Step 2: Analysis
        print("\n[STEP 2] Running Analysis Agent...")
        analysis_start = time.time()
        analysis_result = self.analysis_agent.analyze(research_result)
        analysis_time = time.time() - analysis_start

        print(f"  -> Generated {len(analysis_result.key_insights)} insights")
        print(f"  -> Generated {len(analysis_result.recommendations)} recommendations")

        pipeline_time = time.time() - pipeline_start

        # Compile results
        results = {
            "topic": topic,
            "research": asdict(research_result),
            "analysis": asdict(analysis_result),
            "pipeline_metrics": {
                "total_time_seconds": round(pipeline_time, 2),
                "research_time_seconds": round(research_time, 2),
                "analysis_time_seconds": round(analysis_time, 2),
                "llm_metrics": self.callback.get_metrics()
            }
        }

        # Log pipeline completion
        self.pipeline_tracer.log_trace({
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event": "pipeline_complete",
            "topic": topic,
            "total_time_ms": round(pipeline_time * 1000, 2),
            "llm_calls": self.callback.metrics["total_calls"],
            "status": "success"
        })

        print(f"\n{'=' * 60}")
        print(f"PIPELINE COMPLETE - Total time: {pipeline_time:.2f}s")
        print(f"{'=' * 60}")

        return results

    def get_monitoring_summary(self) -> Dict[str, Any]:
        """Get summary of all monitoring data."""
        return {
            "llm_metrics": self.callback.get_metrics(),
            "trace_files": [
                "cert_traces.jsonl",
                "research_agent_traces.jsonl",
                "analysis_agent_traces.jsonl",
                "pipeline_traces.jsonl"
            ]
        }


# ============================================================================
# Main Entry Point
# ============================================================================

def main():
    """Run the agentic pipeline demo."""
    import os

    print("\n" + "=" * 60)
    print("CERT Framework - Agentic Pipeline Example")
    print("=" * 60)

    # Check for API key
    if not os.getenv("ANTHROPIC_API_KEY") and LANGCHAIN_AVAILABLE:
        print("\n⚠️  ANTHROPIC_API_KEY not set - running in mock mode")
        print("Set API key with: export ANTHROPIC_API_KEY=your-key-here")

    # Initialize pipeline
    pipeline = ResearchPipeline(model="claude-sonnet-4-20250514")

    # Run pipeline on sample topics
    topics = [
        "Impact of AI on software development productivity",
        "Trends in cloud computing for 2025"
    ]

    all_results = []
    for topic in topics:
        result = pipeline.run(topic)
        all_results.append(result)

    # Save results
    output_file = "pipeline_results.json"
    with open(output_file, "w") as f:
        json.dump(all_results, f, indent=2, default=str)
    print(f"\nResults saved to: {output_file}")

    # Print monitoring summary
    print("\n" + "=" * 60)
    print("CERT MONITORING SUMMARY")
    print("=" * 60)

    summary = pipeline.get_monitoring_summary()
    metrics = summary["llm_metrics"]

    print(f"Total LLM Calls: {metrics['total_calls']}")
    print(f"Total Input Tokens: {metrics['total_input_tokens']}")
    print(f"Total Output Tokens: {metrics['total_output_tokens']}")
    print(f"Average Latency: {metrics['average_latency_ms']:.2f}ms")
    print(f"Errors: {metrics['errors']}")

    print(f"\nTrace files generated:")
    for trace_file in summary['trace_files']:
        if Path(trace_file).exists():
            lines = sum(1 for _ in open(trace_file))
            print(f"  - {trace_file} ({lines} traces)")

    # Sample output
    if all_results:
        print("\n" + "=" * 60)
        print("SAMPLE ANALYSIS OUTPUT")
        print("=" * 60)
        analysis = all_results[0]["analysis"]
        print(f"\nTopic: {all_results[0]['topic']}")
        print(f"\nSummary: {analysis['summary']}")
        print(f"\nKey Insights:")
        for i, insight in enumerate(analysis['key_insights'][:3], 1):
            print(f"  {i}. {insight}")

    print("\n✓ Pipeline completed successfully!")
    print("\nNext steps:")
    print("  1. View traces: cat cert_traces.jsonl | head")
    print("  2. Analyze costs: cert costs cert_traces.jsonl")
    print("  3. Generate report: cert report cert_traces.jsonl")


if __name__ == "__main__":
    main()
