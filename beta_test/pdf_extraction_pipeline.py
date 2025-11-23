"""
PDF Extraction & Report Generation Pipeline
============================================

A real-world agentic application using LangChain + Claude with cert-framework monitoring.

This pipeline demonstrates:
1. Agent 1: PDF Extraction Agent - extracts key information from PDF documents
2. Agent 2: Report Generation Agent - creates structured reports from extracted data

Both agents are monitored using cert-framework for:
- Cost tracking
- Latency monitoring
- Trace logging
- EU AI Act compliance

Usage:
    python pdf_extraction_pipeline.py

Requirements:
    - ANTHROPIC_API_KEY environment variable set
    - cert-framework installed with [langchain,anthropic,cli] extras
"""

import os
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict

# PDF processing - handle import errors gracefully
try:
    from pypdf import PdfReader
    PYPDF_AVAILABLE = True
except ImportError:
    PYPDF_AVAILABLE = False
    print("Warning: pypdf not available, will use text files instead")

# LangChain imports - use langchain_core for newer versions
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.callbacks import BaseCallbackHandler

# CERT Framework imports
from cert import trace
from cert.core.tracer import CertTracer

# Try to import optional CERT modules
try:
    from cert.integrations.langchain_connector import LangChainConnector, CERTCallbackHandler
    from cert.integrations.registry import get_active_connectors
    LANGCHAIN_CONNECTOR_AVAILABLE = True
except ImportError:
    LANGCHAIN_CONNECTOR_AVAILABLE = False
    print("Warning: LangChain connector not fully available")


# ============================================================================
# Data Models
# ============================================================================

@dataclass
class ExtractedData:
    """Data extracted from a PDF document."""
    document_name: str
    document_type: str  # financial_report, research_paper, contract, etc.
    summary: str
    key_metrics: Dict[str, Any]
    entities: List[str]  # Companies, people, locations mentioned
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
            "model": serialized.get("kwargs", {}).get("model", "unknown")
        }
        self.metrics["total_calls"] += 1

    def on_llm_end(self, response, **kwargs):
        """Record when LLM call ends and log to CERT."""
        run_id = str(kwargs.get("run_id", "unknown"))

        if run_id in self.active_calls:
            call_data = self.active_calls.pop(run_id)
            latency_ms = (time.time() - call_data["start_time"]) * 1000
            self.metrics["total_latency_ms"] += latency_ms

            # Extract token usage if available
            token_usage = {}
            if hasattr(response, "llm_output") and response.llm_output:
                token_usage = response.llm_output.get("token_usage", {})
                self.metrics["total_tokens"] += token_usage.get("total_tokens", 0)

            # Extract output text
            output_text = ""
            if response.generations and len(response.generations) > 0:
                if len(response.generations[0]) > 0:
                    output_text = response.generations[0][0].text

            # Log to CERT tracer
            trace_data = {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "platform": "langchain-anthropic",
                "model": call_data["model"],
                "input_preview": call_data["prompts"][0][:200] if call_data["prompts"] else "",
                "output_preview": output_text[:200] if output_text else "",
                "latency_ms": round(latency_ms, 2),
                "token_usage": token_usage,
                "status": "success"
            }
            self.tracer.log_trace(trace_data)

    def on_llm_error(self, error, **kwargs):
        """Record errors."""
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
        """Get aggregated metrics."""
        avg_latency = 0
        if self.metrics["total_calls"] > 0:
            avg_latency = self.metrics["total_latency_ms"] / self.metrics["total_calls"]

        return {
            **self.metrics,
            "average_latency_ms": round(avg_latency, 2)
        }


# ============================================================================
# Agent 1: PDF Extraction Agent
# ============================================================================

class PDFExtractionAgent:
    """
    Agent 1: Extracts structured information from PDF documents.

    Uses Claude to analyze PDF content and extract:
    - Document summary
    - Key metrics and numbers
    - Named entities (companies, people, locations)
    - Important dates
    - Document classification
    """

    EXTRACTION_PROMPT = """You are an expert document analyst. Analyze the following document text and extract structured information.

DOCUMENT TEXT:
{document_text}

Provide your analysis in the following JSON format:
{{
    "document_type": "financial_report|research_paper|contract|memo|other",
    "summary": "A 2-3 sentence summary of the document's main content",
    "key_metrics": {{
        "metric_name": "metric_value",
        ...
    }},
    "entities": ["list", "of", "companies", "people", "locations"],
    "dates": ["list of dates mentioned in format YYYY-MM-DD or as written"],
    "numerical_data": [
        {{"label": "description", "value": "number", "unit": "USD|%|units|etc"}}
    ],
    "confidence_score": 0.0-1.0
}}

Focus on accuracy. If information is unclear, indicate lower confidence.
Return ONLY valid JSON, no additional text."""

    def __init__(self, model: str = "claude-sonnet-4-20250514", callback: Optional[BaseCallbackHandler] = None):
        """Initialize the PDF extraction agent."""
        self.model = model
        self.callback = callback
        self.llm = ChatAnthropic(
            model=model,
            max_tokens=4096,
            callbacks=[callback] if callback else None
        )
        self.tracer = CertTracer("extraction_agent_traces.jsonl")

    def read_pdf(self, pdf_path: str) -> str:
        """Read text content from a PDF or text file."""
        # Handle text files directly
        if pdf_path.endswith(".txt"):
            if Path(pdf_path).exists():
                return Path(pdf_path).read_text()
            return f"[Text file not found: {pdf_path}]"

        if not PYPDF_AVAILABLE:
            # Fallback: try to read as text or use a placeholder
            txt_path = pdf_path.replace(".pdf", ".txt")
            if Path(txt_path).exists():
                return Path(txt_path).read_text()
            return f"[PDF content from {pdf_path} - pypdf not available for extraction]"

        try:
            reader = PdfReader(pdf_path)
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            return text if text.strip() else f"[Empty PDF: {pdf_path}]"
        except Exception as e:
            print(f"  Warning: Error reading PDF {pdf_path}: {e}")
            # Try text file fallback
            txt_path = pdf_path.replace(".pdf", ".txt")
            if Path(txt_path).exists():
                print(f"  Using text fallback: {txt_path}")
                return Path(txt_path).read_text()
            return f"[Error reading PDF: {e}]"

    @trace(log_path="extraction_agent_traces.jsonl", metadata={"agent": "pdf_extraction"})
    def extract(self, pdf_path: str) -> ExtractedData:
        """
        Extract structured data from a PDF document.

        Args:
            pdf_path: Path to the PDF file

        Returns:
            ExtractedData object with extracted information
        """
        start_time = time.time()

        # Read PDF content
        print(f"  [Extraction Agent] Reading PDF: {pdf_path}")
        document_text = self.read_pdf(pdf_path)

        # Truncate very long documents
        max_chars = 15000
        if len(document_text) > max_chars:
            document_text = document_text[:max_chars] + "\n\n[Document truncated for processing...]"

        # Call LLM for extraction
        print(f"  [Extraction Agent] Analyzing document with {self.model}...")

        messages = [
            SystemMessage(content="You are an expert document analyst specializing in extracting structured data from documents."),
            HumanMessage(content=self.EXTRACTION_PROMPT.format(document_text=document_text))
        ]

        response = self.llm.invoke(messages)

        # Parse response
        try:
            # Extract JSON from response
            response_text = response.content
            # Handle potential markdown code blocks
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]

            parsed = json.loads(response_text.strip())
        except json.JSONDecodeError as e:
            print(f"  [Extraction Agent] Warning: Failed to parse JSON response: {e}")
            # Create a fallback structure
            parsed = {
                "document_type": "unknown",
                "summary": response.content[:500] if response.content else "Unable to extract summary",
                "key_metrics": {},
                "entities": [],
                "dates": [],
                "numerical_data": [],
                "confidence_score": 0.3
            }

        extraction_time = time.time() - start_time
        print(f"  [Extraction Agent] Extraction completed in {extraction_time:.2f}s")

        return ExtractedData(
            document_name=Path(pdf_path).name,
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
# Agent 2: Report Generation Agent
# ============================================================================

class ReportGenerationAgent:
    """
    Agent 2: Generates structured reports from extracted data.

    Takes the output from the Extraction Agent and produces:
    - Executive summary
    - Key findings analysis
    - Data interpretation
    - Recommendations
    - Risk assessment
    """

    REPORT_PROMPT = """You are a senior business analyst. Based on the extracted document data below, generate a comprehensive analytical report.

EXTRACTED DATA:
- Document: {document_name}
- Type: {document_type}
- Summary: {summary}
- Key Metrics: {key_metrics}
- Entities: {entities}
- Dates: {dates}
- Numerical Data: {numerical_data}
- Extraction Confidence: {confidence_score}

Generate a professional report with the following sections:

1. EXECUTIVE SUMMARY: A concise 2-3 paragraph summary for executives

2. KEY FINDINGS: List 5-7 most important findings with specific numbers/data

3. DATA ANALYSIS: Detailed analysis of the numerical data and trends (2-3 paragraphs)

4. RECOMMENDATIONS: 3-5 actionable recommendations based on the data

5. RISK FACTORS: 3-5 potential risks or concerns identified in the data

Format your response as JSON:
{{
    "title": "Report title",
    "executive_summary": "Executive summary text",
    "key_findings": ["finding 1", "finding 2", ...],
    "data_analysis": "Analysis text",
    "recommendations": ["recommendation 1", "recommendation 2", ...],
    "risk_factors": ["risk 1", "risk 2", ...]
}}

Provide insightful analysis, not just repetition of the data. Return ONLY valid JSON."""

    def __init__(self, model: str = "claude-sonnet-4-20250514", callback: Optional[BaseCallbackHandler] = None):
        """Initialize the report generation agent."""
        self.model = model
        self.callback = callback
        self.llm = ChatAnthropic(
            model=model,
            max_tokens=4096,
            callbacks=[callback] if callback else None
        )
        self.tracer = CertTracer("report_agent_traces.jsonl")

    @trace(log_path="report_agent_traces.jsonl", metadata={"agent": "report_generation"})
    def generate_report(self, extracted_data: ExtractedData) -> GeneratedReport:
        """
        Generate a structured report from extracted data.

        Args:
            extracted_data: ExtractedData from the extraction agent

        Returns:
            GeneratedReport with analysis and recommendations
        """
        start_time = time.time()

        print(f"  [Report Agent] Generating report for: {extracted_data.document_name}")

        # Format the prompt
        prompt_data = {
            "document_name": extracted_data.document_name,
            "document_type": extracted_data.document_type,
            "summary": extracted_data.summary,
            "key_metrics": json.dumps(extracted_data.key_metrics, indent=2),
            "entities": ", ".join(extracted_data.entities),
            "dates": ", ".join(extracted_data.dates),
            "numerical_data": json.dumps(extracted_data.numerical_data, indent=2),
            "confidence_score": extracted_data.confidence_score
        }

        messages = [
            SystemMessage(content="You are a senior business analyst creating executive reports."),
            HumanMessage(content=self.REPORT_PROMPT.format(**prompt_data))
        ]

        response = self.llm.invoke(messages)

        # Parse response
        try:
            response_text = response.content
            # Handle potential markdown code blocks
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]

            parsed = json.loads(response_text.strip())
        except json.JSONDecodeError as e:
            print(f"  [Report Agent] Warning: Failed to parse JSON response: {e}")
            parsed = {
                "title": f"Analysis Report: {extracted_data.document_name}",
                "executive_summary": response.content[:1000] if response.content else "Report generation failed",
                "key_findings": ["Unable to parse structured findings"],
                "data_analysis": "Analysis parsing failed",
                "recommendations": ["Review source document"],
                "risk_factors": ["Report generation encountered issues"]
            }

        report_time = time.time() - start_time
        print(f"  [Report Agent] Report generated in {report_time:.2f}s")

        # Calculate word count
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

class PDFAnalysisPipeline:
    """
    Sequential pipeline orchestrating PDF extraction and report generation.

    Pipeline flow:
    1. PDF Document -> Extraction Agent -> ExtractedData
    2. ExtractedData -> Report Agent -> GeneratedReport

    All steps are monitored with CERT framework.
    """

    def __init__(self, model: str = "claude-sonnet-4-20250514"):
        """Initialize the pipeline with CERT monitoring."""
        self.model = model
        self.pipeline_tracer = CertTracer("pipeline_traces.jsonl")

        # Create shared callback for monitoring
        self.callback = EnhancedCERTCallback(log_path="cert_traces.jsonl")

        # Initialize agents
        self.extraction_agent = PDFExtractionAgent(model=model, callback=self.callback)
        self.report_agent = ReportGenerationAgent(model=model, callback=self.callback)

        print(f"Pipeline initialized with model: {model}")
        print(f"CERT monitoring enabled - traces will be logged to cert_traces.jsonl")

    @trace(log_path="pipeline_traces.jsonl", metadata={"component": "pipeline_orchestrator"})
    def process_document(self, pdf_path: str) -> Dict[str, Any]:
        """
        Process a PDF document through the full pipeline.

        Args:
            pdf_path: Path to the PDF document

        Returns:
            Dictionary containing extraction results, generated report, and pipeline metrics
        """
        pipeline_start = time.time()

        print("\n" + "="*60)
        print(f"PROCESSING: {pdf_path}")
        print("="*60)

        # Log pipeline start
        self.pipeline_tracer.log_trace({
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event": "pipeline_start",
            "document": pdf_path
        })

        # Step 1: Extract data from PDF
        print("\n[STEP 1] Running PDF Extraction Agent...")
        extraction_start = time.time()
        extracted_data = self.extraction_agent.extract(pdf_path)
        extraction_time = time.time() - extraction_start

        print(f"  -> Document type: {extracted_data.document_type}")
        print(f"  -> Confidence: {extracted_data.confidence_score:.2f}")
        print(f"  -> Entities found: {len(extracted_data.entities)}")
        print(f"  -> Metrics found: {len(extracted_data.key_metrics)}")

        # Step 2: Generate report from extracted data
        print("\n[STEP 2] Running Report Generation Agent...")
        report_start = time.time()
        report = self.report_agent.generate_report(extracted_data)
        report_time = time.time() - report_start

        print(f"  -> Report title: {report.title}")
        print(f"  -> Key findings: {len(report.key_findings)}")
        print(f"  -> Recommendations: {len(report.recommendations)}")
        print(f"  -> Word count: {report.word_count}")

        pipeline_time = time.time() - pipeline_start

        # Compile results
        results = {
            "document_path": pdf_path,
            "extracted_data": asdict(extracted_data),
            "generated_report": asdict(report),
            "pipeline_metrics": {
                "total_time_seconds": round(pipeline_time, 2),
                "extraction_time_seconds": round(extraction_time, 2),
                "report_time_seconds": round(report_time, 2),
                "llm_metrics": self.callback.get_metrics()
            }
        }

        # Log pipeline completion
        self.pipeline_tracer.log_trace({
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event": "pipeline_complete",
            "document": pdf_path,
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

    def process_batch(self, pdf_paths: List[str]) -> List[Dict[str, Any]]:
        """Process multiple PDF documents."""
        results = []
        for i, path in enumerate(pdf_paths, 1):
            print(f"\n\n{'#'*60}")
            print(f"DOCUMENT {i}/{len(pdf_paths)}")
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
    """Run the PDF analysis pipeline demo."""

    # Check for API key
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("ERROR: ANTHROPIC_API_KEY environment variable not set")
        print("\nTo run this demo:")
        print("  export ANTHROPIC_API_KEY='your-api-key-here'")
        print("  python pdf_extraction_pipeline.py")
        return

    print("\n" + "="*60)
    print("PDF EXTRACTION & REPORT GENERATION PIPELINE")
    print("Using LangChain + Claude with CERT Framework Monitoring")
    print("="*60)

    # Try PDF files first, fall back to text files
    document_files = []

    # Check for PDF files
    pdf_files = ["sample_financial_report.pdf", "sample_research_paper.pdf"]
    txt_files = ["sample_financial_report.txt", "sample_research_paper.txt"]

    # Try PDFs first
    if PYPDF_AVAILABLE:
        for pdf_file in pdf_files:
            if Path(pdf_file).exists():
                document_files.append(pdf_file)

    # If no PDFs or pypdf not available, use text files
    if not document_files:
        print("\nUsing text files instead of PDFs...")
        for txt_file in txt_files:
            if Path(txt_file).exists():
                document_files.append(txt_file)

    if not document_files:
        print("\nNo document files found to process!")
        print("Please ensure sample_financial_report.txt or .pdf exists")
        return

    print(f"\nDocuments to process: {document_files}")

    # Initialize pipeline
    pipeline = PDFAnalysisPipeline(model="claude-sonnet-4-20250514")

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


if __name__ == "__main__":
    main()
