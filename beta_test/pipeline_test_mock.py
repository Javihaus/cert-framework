"""
Mock Test for PDF Extraction Pipeline with CERT Framework Monitoring
=====================================================================

This script tests the cert-framework monitoring capabilities using mock LLM responses.
This allows testing the framework's functionality without actual API keys.
"""

import os
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict

# CERT Framework imports
from cert import trace
from cert.core.tracer import CertTracer

# LangChain callback base
from langchain_core.callbacks import BaseCallbackHandler


# ============================================================================
# Data Models
# ============================================================================

@dataclass
class ExtractedData:
    """Data extracted from a PDF document."""
    document_name: str
    document_type: str
    summary: str
    key_metrics: Dict[str, Any]
    entities: List[str]
    dates: List[str]
    numerical_data: List[Dict[str, Any]]
    confidence_score: float
    extraction_timestamp: str
    raw_text_preview: str


@dataclass
class GeneratedReport:
    """Generated report from extracted data."""
    title: str
    executive_summary: str
    key_findings: List[str]
    data_analysis: str
    recommendations: List[str]
    risk_factors: List[str]
    generation_timestamp: str
    source_document: str
    word_count: int


# ============================================================================
# Custom CERT Callback Handler for Enhanced Monitoring
# ============================================================================

class EnhancedCERTCallback(BaseCallbackHandler):
    """Enhanced callback handler that logs to CERT tracer with additional metrics."""

    def __init__(self, log_path: str = "cert_traces.jsonl"):
        super().__init__()
        self.tracer = CertTracer(log_path)
        self.active_calls = {}
        self.metrics = {
            "total_calls": 0,
            "total_tokens": 0,
            "total_latency_ms": 0,
            "errors": 0
        }

    def on_llm_start(self, serialized: Dict, prompts: List[str], **kwargs):
        """Record when LLM call starts."""
        run_id = kwargs.get("run_id", "unknown")
        self.active_calls[str(run_id)] = {
            "start_time": time.time(),
            "prompts": prompts,
            "model": serialized.get("kwargs", {}).get("model", "mock-claude")
        }
        self.metrics["total_calls"] += 1

    def record_call(self, model: str, input_text: str, output_text: str, latency_ms: float, tokens: int):
        """Manually record a mock LLM call."""
        self.metrics["total_calls"] += 1
        self.metrics["total_latency_ms"] += latency_ms
        self.metrics["total_tokens"] += tokens

        trace_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "platform": "mock-langchain-anthropic",
            "model": model,
            "input_preview": input_text[:200] if input_text else "",
            "output_preview": output_text[:200] if output_text else "",
            "latency_ms": round(latency_ms, 2),
            "token_usage": {"total_tokens": tokens, "input_tokens": tokens // 2, "output_tokens": tokens // 2},
            "status": "success"
        }
        self.tracer.log_trace(trace_data)

    def get_metrics(self) -> Dict[str, Any]:
        """Get aggregated metrics."""
        avg_latency = 0
        if self.metrics["total_calls"] > 0:
            avg_latency = self.metrics["total_latency_ms"] / self.metrics["total_calls"]

        return {
            **self.metrics,
            "average_latency_ms": round(avg_latency, 2)
        }


# ============================================================================
# Mock LLM for Testing
# ============================================================================

class MockClaude:
    """Mock Claude LLM for testing without API keys."""

    def __init__(self, callback: Optional[EnhancedCERTCallback] = None):
        self.callback = callback
        self.model = "claude-sonnet-4-mock"

    def invoke(self, messages, **kwargs) -> str:
        """Simulate an LLM call with realistic delay and response."""
        start_time = time.time()

        # Simulate network latency (200-800ms)
        simulated_latency = 300 + (hash(str(messages)) % 500)
        time.sleep(simulated_latency / 1000)

        # Get input text
        input_text = ""
        for msg in messages:
            if hasattr(msg, 'content'):
                input_text += msg.content

        # Generate mock response based on input
        if "financial" in input_text.lower() or "revenue" in input_text.lower():
            response = self._mock_financial_extraction()
        elif "research" in input_text.lower() or "study" in input_text.lower():
            response = self._mock_research_extraction()
        elif "report" in input_text.lower() or "analysis" in input_text.lower():
            response = self._mock_report_generation()
        else:
            response = self._mock_generic_extraction()

        latency_ms = (time.time() - start_time) * 1000
        tokens = len(input_text.split()) + len(response.split())

        # Record to CERT callback
        if self.callback:
            self.callback.record_call(
                model=self.model,
                input_text=input_text,
                output_text=response,
                latency_ms=latency_ms,
                tokens=tokens
            )

        # Return mock response object
        class MockResponse:
            def __init__(self, content):
                self.content = content
        return MockResponse(response)

    def _mock_financial_extraction(self) -> str:
        return json.dumps({
            "document_type": "financial_report",
            "summary": "Q3 2024 financial report showing 23% YoY revenue growth to $125.5M, with strong performance in cloud services (+35%) and enterprise software (+12%).",
            "key_metrics": {
                "total_revenue": "$125.5M",
                "revenue_growth": "23%",
                "net_income": "$18.2M",
                "profit_margin": "14.5%",
                "cloud_revenue": "$78.2M",
                "enterprise_customers": 342
            },
            "entities": ["TechCorp Inc.", "North America", "Europe", "Asia Pacific"],
            "dates": ["Q3 2024", "Q2 2024", "Q4 2024", "2025"],
            "numerical_data": [
                {"label": "Total Revenue", "value": "125.5", "unit": "million USD"},
                {"label": "Cloud Services Revenue", "value": "78.2", "unit": "million USD"},
                {"label": "Customer Retention Rate", "value": "94.2", "unit": "%"},
                {"label": "Net Promoter Score", "value": "72", "unit": "points"}
            ],
            "confidence_score": 0.92
        })

    def _mock_research_extraction(self) -> str:
        return json.dumps({
            "document_type": "research_paper",
            "summary": "Comprehensive study of 500 development teams showing 37% productivity increase with AI-assisted coding tools over 18 months.",
            "key_metrics": {
                "productivity_increase": "37%",
                "code_quality_improvement": "22%",
                "deployment_time_decrease": "31%",
                "teams_studied": 500,
                "study_duration": "18 months",
                "roi": "312%"
            },
            "entities": ["Dr. Sarah Chen", "Prof. Michael Rodriguez", "Dr. Emily Watson", "Journal of Software Engineering Research"],
            "dates": ["September 2024", "January 2023", "June 2024"],
            "numerical_data": [
                {"label": "LOC per developer per day increase", "value": "37", "unit": "%"},
                {"label": "Bug fix resolution time decrease", "value": "24", "unit": "%"},
                {"label": "Cost savings per developer", "value": "45000", "unit": "USD/year"},
                {"label": "Developer satisfaction score", "value": "8.2", "unit": "out of 10"}
            ],
            "confidence_score": 0.89
        })

    def _mock_report_generation(self) -> str:
        return json.dumps({
            "title": "Comprehensive Analysis Report",
            "executive_summary": "This analysis reveals significant positive trends with 23% revenue growth driven primarily by cloud services expansion. The company demonstrates strong market position with 94.2% customer retention and expanding enterprise customer base. Financial health indicators suggest sustainable growth trajectory with opportunities for strategic investment in AI and cloud infrastructure.",
            "key_findings": [
                "Revenue grew 23% YoY to $125.5M, exceeding analyst expectations",
                "Cloud services segment showed exceptional growth at 35% YoY",
                "Customer retention rate of 94.2% indicates strong product-market fit",
                "Enterprise customer base expanded 25% quarter-over-quarter",
                "Profit margin of 14.5% demonstrates operational efficiency",
                "Geographic diversification continues with growing APAC presence"
            ],
            "data_analysis": "The financial data reveals a company in a strong growth phase with particularly impressive performance in the cloud services segment. The 35% YoY growth in cloud revenue suggests successful market penetration and competitive positioning. Operating expenses have increased 15% but remain proportionally lower than revenue growth, indicating improving operational leverage. The customer metrics paint a picture of a sticky product with high retention rates and strong customer advocacy as evidenced by the NPS of 72.",
            "recommendations": [
                "Continue prioritizing cloud services investment given strong growth trajectory",
                "Consider strategic acquisitions in APAC region to accelerate market penetration",
                "Maintain focus on enterprise customers as they show higher expansion rates",
                "Invest in AI capabilities as outlined in 2025 roadmap",
                "Consider expansion of professional services to complement software offerings"
            ],
            "risk_factors": [
                "Concentration risk from large cloud provider competition",
                "Currency fluctuation exposure in international markets",
                "Regulatory uncertainty in data privacy compliance",
                "Talent acquisition challenges in competitive tech market",
                "Dependency on key enterprise customer accounts"
            ]
        })

    def _mock_generic_extraction(self) -> str:
        return json.dumps({
            "document_type": "unknown",
            "summary": "Document content analyzed but type could not be determined with high confidence.",
            "key_metrics": {},
            "entities": [],
            "dates": [],
            "numerical_data": [],
            "confidence_score": 0.5
        })


# ============================================================================
# Agent 1: PDF Extraction Agent (Mock Version)
# ============================================================================

class MockPDFExtractionAgent:
    """Mock PDF Extraction Agent for testing cert-framework."""

    def __init__(self, callback: Optional[EnhancedCERTCallback] = None):
        self.callback = callback
        self.llm = MockClaude(callback=callback)
        self.tracer = CertTracer("extraction_agent_traces.jsonl")

    def read_document(self, doc_path: str) -> str:
        """Read text content from a document."""
        if Path(doc_path).exists():
            return Path(doc_path).read_text()
        return f"[Document not found: {doc_path}]"

    @trace(log_path="extraction_agent_traces.jsonl", metadata={"agent": "pdf_extraction"})
    def extract(self, doc_path: str) -> ExtractedData:
        """Extract structured data from a document."""
        start_time = time.time()

        print(f"  [Extraction Agent] Reading document: {doc_path}")
        document_text = self.read_document(doc_path)

        print(f"  [Extraction Agent] Analyzing with Mock Claude...")

        # Create mock messages
        class MockMessage:
            def __init__(self, content):
                self.content = content

        messages = [
            MockMessage("You are an expert document analyst."),
            MockMessage(f"Analyze this document and extract data: {document_text[:2000]}")
        ]

        response = self.llm.invoke(messages)

        try:
            parsed = json.loads(response.content)
        except json.JSONDecodeError:
            parsed = {
                "document_type": "unknown",
                "summary": response.content[:500],
                "key_metrics": {},
                "entities": [],
                "dates": [],
                "numerical_data": [],
                "confidence_score": 0.3
            }

        extraction_time = time.time() - start_time
        print(f"  [Extraction Agent] Extraction completed in {extraction_time:.2f}s")

        return ExtractedData(
            document_name=Path(doc_path).name,
            document_type=parsed.get("document_type", "unknown"),
            summary=parsed.get("summary", ""),
            key_metrics=parsed.get("key_metrics", {}),
            entities=parsed.get("entities", []),
            dates=parsed.get("dates", []),
            numerical_data=parsed.get("numerical_data", []),
            confidence_score=parsed.get("confidence_score", 0.5),
            extraction_timestamp=datetime.utcnow().isoformat() + "Z",
            raw_text_preview=document_text[:500]
        )


# ============================================================================
# Agent 2: Report Generation Agent (Mock Version)
# ============================================================================

class MockReportGenerationAgent:
    """Mock Report Generation Agent for testing cert-framework."""

    def __init__(self, callback: Optional[EnhancedCERTCallback] = None):
        self.callback = callback
        self.llm = MockClaude(callback=callback)
        self.tracer = CertTracer("report_agent_traces.jsonl")

    @trace(log_path="report_agent_traces.jsonl", metadata={"agent": "report_generation"})
    def generate_report(self, extracted_data: ExtractedData) -> GeneratedReport:
        """Generate a structured report from extracted data."""
        start_time = time.time()

        print(f"  [Report Agent] Generating report for: {extracted_data.document_name}")

        # Create mock messages
        class MockMessage:
            def __init__(self, content):
                self.content = content

        messages = [
            MockMessage("You are a senior business analyst."),
            MockMessage(f"Generate a report for: {extracted_data.summary}")
        ]

        response = self.llm.invoke(messages)

        try:
            parsed = json.loads(response.content)
        except json.JSONDecodeError:
            parsed = {
                "title": f"Report: {extracted_data.document_name}",
                "executive_summary": response.content[:500],
                "key_findings": ["Unable to parse findings"],
                "data_analysis": "Analysis failed",
                "recommendations": ["Review source document"],
                "risk_factors": ["Report generation issues"]
            }

        report_time = time.time() - start_time
        print(f"  [Report Agent] Report generated in {report_time:.2f}s")

        full_text = " ".join([
            parsed.get("executive_summary", ""),
            parsed.get("data_analysis", ""),
            " ".join(parsed.get("key_findings", [])),
            " ".join(parsed.get("recommendations", [])),
            " ".join(parsed.get("risk_factors", []))
        ])
        word_count = len(full_text.split())

        return GeneratedReport(
            title=parsed.get("title", f"Report: {extracted_data.document_name}"),
            executive_summary=parsed.get("executive_summary", ""),
            key_findings=parsed.get("key_findings", []),
            data_analysis=parsed.get("data_analysis", ""),
            recommendations=parsed.get("recommendations", []),
            risk_factors=parsed.get("risk_factors", []),
            generation_timestamp=datetime.utcnow().isoformat() + "Z",
            source_document=extracted_data.document_name,
            word_count=word_count
        )


# ============================================================================
# Pipeline Orchestrator with CERT Monitoring
# ============================================================================

class MockPDFAnalysisPipeline:
    """Mock Pipeline for testing cert-framework monitoring."""

    def __init__(self):
        self.pipeline_tracer = CertTracer("pipeline_traces.jsonl")
        self.callback = EnhancedCERTCallback(log_path="cert_traces.jsonl")
        self.extraction_agent = MockPDFExtractionAgent(callback=self.callback)
        self.report_agent = MockReportGenerationAgent(callback=self.callback)

        print("Mock Pipeline initialized")
        print("CERT monitoring enabled - traces will be logged to cert_traces.jsonl")

    @trace(log_path="pipeline_traces.jsonl", metadata={"component": "pipeline_orchestrator"})
    def process_document(self, doc_path: str) -> Dict[str, Any]:
        """Process a document through the full pipeline."""
        pipeline_start = time.time()

        print("\n" + "="*60)
        print(f"PROCESSING: {doc_path}")
        print("="*60)

        self.pipeline_tracer.log_trace({
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event": "pipeline_start",
            "document": doc_path
        })

        # Step 1: Extract data
        print("\n[STEP 1] Running PDF Extraction Agent...")
        extraction_start = time.time()
        extracted_data = self.extraction_agent.extract(doc_path)
        extraction_time = time.time() - extraction_start

        print(f"  -> Document type: {extracted_data.document_type}")
        print(f"  -> Confidence: {extracted_data.confidence_score:.2f}")
        print(f"  -> Entities found: {len(extracted_data.entities)}")
        print(f"  -> Metrics found: {len(extracted_data.key_metrics)}")

        # Step 2: Generate report
        print("\n[STEP 2] Running Report Generation Agent...")
        report_start = time.time()
        report = self.report_agent.generate_report(extracted_data)
        report_time = time.time() - report_start

        print(f"  -> Report title: {report.title}")
        print(f"  -> Key findings: {len(report.key_findings)}")
        print(f"  -> Recommendations: {len(report.recommendations)}")
        print(f"  -> Word count: {report.word_count}")

        pipeline_time = time.time() - pipeline_start

        results = {
            "document_path": doc_path,
            "extracted_data": asdict(extracted_data),
            "generated_report": asdict(report),
            "pipeline_metrics": {
                "total_time_seconds": round(pipeline_time, 2),
                "extraction_time_seconds": round(extraction_time, 2),
                "report_time_seconds": round(report_time, 2),
                "llm_metrics": self.callback.get_metrics()
            }
        }

        self.pipeline_tracer.log_trace({
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event": "pipeline_complete",
            "document": doc_path,
            "total_time_ms": round(pipeline_time * 1000, 2),
            "extraction_confidence": extracted_data.confidence_score,
            "report_word_count": report.word_count,
            "llm_calls": self.callback.metrics["total_calls"],
            "status": "success"
        })

        print("\n" + "-"*60)
        print(f"PIPELINE COMPLETE - Total time: {pipeline_time:.2f}s")
        print("-"*60)

        return results

    def process_batch(self, doc_paths: List[str]) -> List[Dict[str, Any]]:
        """Process multiple documents."""
        results = []
        for i, path in enumerate(doc_paths, 1):
            print(f"\n\n{'#'*60}")
            print(f"DOCUMENT {i}/{len(doc_paths)}")
            print(f"{'#'*60}")

            try:
                result = self.process_document(path)
                results.append(result)
            except Exception as e:
                print(f"ERROR processing {path}: {e}")
                results.append({
                    "document_path": path,
                    "error": str(e),
                    "status": "failed"
                })

        return results

    def get_monitoring_summary(self) -> Dict[str, Any]:
        """Get a summary of all monitoring data."""
        return {
            "llm_metrics": self.callback.get_metrics(),
            "trace_files": [
                "cert_traces.jsonl",
                "extraction_agent_traces.jsonl",
                "report_agent_traces.jsonl",
                "pipeline_traces.jsonl"
            ]
        }


# ============================================================================
# Main Entry Point
# ============================================================================

def main():
    """Run the mock PDF analysis pipeline demo."""

    print("\n" + "="*60)
    print("PDF EXTRACTION & REPORT GENERATION PIPELINE (MOCK MODE)")
    print("Testing CERT Framework Monitoring Capabilities")
    print("="*60)

    # Document files to process
    txt_files = ["sample_financial_report.txt", "sample_research_paper.txt"]
    document_files = [f for f in txt_files if Path(f).exists()]

    if not document_files:
        print("\nNo document files found to process!")
        print("Please ensure sample_financial_report.txt exists")
        return

    print(f"\nDocuments to process: {document_files}")

    # Initialize pipeline
    pipeline = MockPDFAnalysisPipeline()

    # Process documents
    results = pipeline.process_batch(document_files)

    # Save results
    output_file = "pipeline_results.json"
    with open(output_file, "w") as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\nResults saved to: {output_file}")

    # Print monitoring summary
    print("\n" + "="*60)
    print("CERT MONITORING SUMMARY")
    print("="*60)
    summary = pipeline.get_monitoring_summary()
    print(f"Total LLM Calls: {summary['llm_metrics']['total_calls']}")
    print(f"Total Tokens: {summary['llm_metrics']['total_tokens']}")
    print(f"Average Latency: {summary['llm_metrics']['average_latency_ms']:.2f}ms")
    print(f"Errors: {summary['llm_metrics']['errors']}")
    print(f"\nTrace files generated:")
    for trace_file in summary['trace_files']:
        if Path(trace_file).exists():
            lines = sum(1 for _ in open(trace_file))
            print(f"  - {trace_file} ({lines} traces)")

    # Display sample report
    if results and "generated_report" in results[0]:
        print("\n" + "="*60)
        print("SAMPLE GENERATED REPORT")
        print("="*60)
        report = results[0]["generated_report"]
        print(f"\nTitle: {report['title']}")
        print(f"\nExecutive Summary:\n{report['executive_summary'][:500]}...")
        print(f"\nKey Findings:")
        for i, finding in enumerate(report['key_findings'][:3], 1):
            print(f"  {i}. {finding[:100]}...")

    return results, summary


if __name__ == "__main__":
    main()
