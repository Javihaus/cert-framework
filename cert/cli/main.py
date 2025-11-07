"""
CERT command line interface.
Only includes production-ready commands.
"""

import sys

try:
    import click
except ImportError:
    print("Error: Click is required for CLI")
    print("Install with: pip install click")
    sys.exit(1)


@click.group()
def cli():
    """CERT: EU AI Act Compliance Toolkit"""
    pass


@cli.command(name="measure")
@click.argument("text1")
@click.argument("text2")
@click.option(
    "--detailed",
    "-d",
    is_flag=True,
    help="Show detailed breakdown (semantic + grounding scores)",
)
def measure_cmd(text1, text2, detailed):
    """Measure semantic accuracy between two texts.

    Examples:
        cert measure "Apple's revenue was $450B" "Apple's revenue was $89.5B"
        cert measure "The cat sat" "A feline was sitting" --detailed
    """
    try:
        from cert.measure import measure, measure_detailed
    except ImportError:
        click.echo("Error: Install cert-framework to use measure", err=True)
        sys.exit(1)

    if detailed:
        result = measure_detailed(text1, text2)
        click.echo(f"Confidence: {result.confidence:.3f}")
        click.echo(f"  Semantic:  {result.semantic_score:.3f}")
        click.echo(f"  Grounding: {result.grounding_score:.3f}")
        click.echo(f"  Status:    {'✓ Accurate' if result.is_accurate() else '✗ Inaccurate'}")
    else:
        score = measure(text1, text2)
        click.echo(f"{score:.3f}")


@cli.command()
@click.argument("trace_file", type=click.Path(exists=True))
@click.option(
    "--format",
    "-f",
    type=click.Choice(["json", "html"]),
    default="json",
    help="Output format",
)
@click.option("--output", "-o", help="Output file path (optional)")
@click.option("--system-name", default="AI System", help="Name of the AI system")
@click.option("--system-version", default="v1.0", help="System version")
@click.option("--provider-name", default="Organization", help="Provider name")
def report(trace_file, format, output, system_name, system_version, provider_name):
    """Generate EU AI Act compliance report.

    Examples:
        cert report traces.jsonl
        cert report traces.jsonl --format html --output report.html
        cert report traces.jsonl --system-name "My RAG System"
    """
    try:
        from cert.compliance.reporter import ComplianceReporter
    except ImportError:
        click.echo("Error: Install cert-framework for compliance reports", err=True)
        sys.exit(1)

    click.echo(f"Generating {format} compliance report...")
    click.echo(f"  Trace file: {trace_file}")
    click.echo(f"  System: {system_name} {system_version}")

    reporter = ComplianceReporter(
        system_name=system_name,
        system_version=system_version,
        provider_name=provider_name,
    )

    try:
        if output:
            reporter.save_report(trace_file, output, format=format)
            click.echo(f"✓ Report saved to {output}")
        else:
            result = reporter.generate_report(trace_file, format=format)
            if format == "json":
                import json

                click.echo(json.dumps(result, indent=2))
            else:
                click.echo(result)
    except FileNotFoundError as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)
    except ValueError as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


@cli.command()
def version():
    """Show CERT version."""
    try:
        from cert import __version__
    except ImportError:
        __version__ = "unknown"

    click.echo(f"CERT Framework v{__version__}")


@cli.command()
@click.argument("trace_file", type=click.Path(exists=True))
@click.option("--metadata", "-m", type=click.Path(exists=True), help="System metadata JSON file")
@click.option(
    "--output",
    "-o",
    type=click.Path(),
    help="Output file (default: print to stdout)",
)
@click.option(
    "--format",
    "-f",
    type=click.Choice(["json", "html", "docx"]),
    default="json",
    help="Output format (default: json)",
)
@click.option(
    "--threshold",
    "-t",
    type=float,
    default=0.7,
    help="Accuracy threshold (default: 0.7)",
)
@click.option(
    "--evaluator",
    "-e",
    type=click.Choice(["semantic", "exact"]),
    default="semantic",
    help="Accuracy evaluator type (default: semantic)",
)
def audit(trace_file, metadata, output, format, threshold, evaluator):
    """One-command EU AI Act Article 15 compliance check.

    Evaluates traces for accuracy and generates compliance report.

    Examples:
        # Quick JSON output
        cert audit traces.jsonl

        # With metadata and HTML report
        cert audit traces.jsonl --metadata system.json --output report.html --format html

        # Generate Word document for regulatory submission
        cert audit traces.jsonl --metadata system.json --output report.docx --format docx

        # Programmatic access
        cert audit traces.jsonl --format json | jq '.article_15.accuracy'

        # Financial domain with exact matching
        cert audit traces.jsonl --evaluator exact --threshold 0.9
    """
    try:
        import json as json_lib
        from datetime import datetime

        from cert.evaluation import Evaluator, ExactMatchEvaluator, SemanticEvaluator
    except ImportError:
        click.echo(
            "Error: Install evaluation features with: pip install cert-framework[evaluation]",
            err=True,
        )
        sys.exit(1)

    # Select evaluator
    if evaluator == "exact":
        accuracy_evaluator = ExactMatchEvaluator()
    else:
        accuracy_evaluator = SemanticEvaluator()

    # Run evaluation
    click.echo(f"Evaluating {trace_file} with {accuracy_evaluator.name}...", err=True)

    evaluator_instance = Evaluator(threshold=threshold, accuracy_evaluator=accuracy_evaluator)

    try:
        results = evaluator_instance.evaluate_log_file(trace_file)
    except Exception as e:
        click.echo(f"Error evaluating traces: {e}", err=True)
        sys.exit(1)

    # Load metadata if provided
    system_metadata = {}
    if metadata:
        try:
            with open(metadata) as f:
                system_metadata = json_lib.load(f)
        except Exception as e:
            click.echo(f"Warning: Could not load metadata: {e}", err=True)

    # Build compliance report
    report_data = {
        "audit_timestamp": datetime.utcnow().isoformat() + "Z",
        "system_metadata": system_metadata,
        "article_15": {
            "accuracy": results["pass_rate"],
            "threshold": threshold,
            "total_traces": results["total_traces"],
            "passed_traces": results["passed"],
            "failed_traces": results["failed"],
            "compliant": results["pass_rate"] >= 0.9,
            "evaluator_type": accuracy_evaluator.name,
            "evaluator_description": accuracy_evaluator.description,
        },
        "traces": results["results"] if format == "json" else None,
    }

    # Output
    if format == "docx":
        # Generate .docx using Article15Report schema
        try:
            from cert.compliance.docx_generator import DocxReportGenerator
            from cert.compliance.schemas import (
                Article15Report,
                FailedTrace,
                PerformanceMetrics,
                SystemMetadata,
                TemporalAnalysis,
            )
        except ImportError:
            click.echo(
                "Error: Install compliance features with: pip install cert-framework[compliance]",
                err=True,
            )
            sys.exit(1)

        # Build Article15Report from evaluation results
        metadata_obj = SystemMetadata(
            system_name=system_metadata.get("system_name", "AI System"),
            system_version=system_metadata.get("system_version", "v1.0"),
            provider_name=system_metadata.get("provider_name", "Organization"),
            intended_purpose=system_metadata.get(
                "intended_purpose", "AI-powered system for production use"
            ),
            report_date=datetime.utcnow().isoformat() + "Z",
            evaluator_name=system_metadata.get("evaluator_name"),
        )

        performance_obj = PerformanceMetrics(
            total_traces=results["total_traces"],
            evaluated_traces=results["total_traces"],
            passed_traces=results["passed"],
            failed_traces=results["failed"],
            accuracy_percentage=results["pass_rate"] * 100,
            mean_confidence=results.get("mean_confidence", 0.0),
            median_confidence=results.get("median_confidence", 0.0),
            threshold_used=threshold,
        )

        # Build temporal analysis (simplified - single day)
        temporal_obj = TemporalAnalysis(
            period_start=datetime.utcnow().isoformat() + "Z",
            period_end=datetime.utcnow().isoformat() + "Z",
            daily_accuracy=[
                {"date": datetime.utcnow().strftime("%Y-%m-%d"), "accuracy": results["pass_rate"]}
            ],
        )

        # Build failed traces list
        failed_traces_list = []
        if results.get("results"):
            for trace_result in results["results"]:
                if not trace_result.get("passed", True):
                    failed_traces_list.append(
                        FailedTrace(
                            timestamp=datetime.utcnow().isoformat() + "Z",
                            input_query=trace_result.get("input_query"),
                            context=trace_result.get("context", ""),
                            answer=trace_result.get("answer", ""),
                            confidence=trace_result.get("confidence", 0.0),
                            reason=trace_result.get("reason", "Below threshold"),
                        )
                    )

        article15_report = Article15Report(
            metadata=metadata_obj,
            performance=performance_obj,
            temporal=temporal_obj,
            failed_traces=failed_traces_list,
            evaluation_methodology=f"{accuracy_evaluator.description}. Threshold: {threshold}",
            compliance_statement=f"This system {'meets' if report_data['article_15']['compliant'] else 'does not meet'} EU AI Act Article 15 requirements for accuracy monitoring. Evaluation conducted using {accuracy_evaluator.name} with {results['total_traces']} traces. Pass rate of {results['pass_rate']:.1%} {'exceeds' if report_data['article_15']['compliant'] else 'is below'} the 90% compliance threshold.",
        )

        if not output:
            click.echo(
                "Error: --output is required for .docx format (e.g., --output report.docx)",
                err=True,
            )
            sys.exit(1)

        try:
            generator = DocxReportGenerator()
            generator.generate_article15(article15_report, output)
            click.echo(f"✓ DOCX report saved to {output}", err=True)
            click.echo(f"  Open with: open {output}", err=True)
        except FileNotFoundError as e:
            click.echo(f"Error: {e}", err=True)
            click.echo("  Create template with: python templates/generate_templates.py", err=True)
            sys.exit(1)

    elif format == "html":
        html_output = generate_html_report(report_data)
        if output:
            with open(output, "w") as f:
                f.write(html_output)
            click.echo(f"✓ HTML report saved to {output}", err=True)
            click.echo(f"  Open with: open {output}", err=True)
        else:
            click.echo(html_output)
    else:
        json_output = json_lib.dumps(report_data, indent=2)
        if output:
            with open(output, "w") as f:
                f.write(json_output)
            click.echo(f"✓ JSON report saved to {output}", err=True)
        else:
            click.echo(json_output)


def generate_html_report(data: dict) -> str:
    """Generate a simple HTML compliance report."""
    article_15 = data["article_15"]
    compliant = article_15["compliant"]
    status_color = "#48bb78" if compliant else "#fc8181"
    status_text = "COMPLIANT" if compliant else "NON-COMPLIANT"

    html = f"""<!DOCTYPE html>
<html>
<head>
    <title>EU AI Act Compliance Report</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 900px; margin: 40px auto; padding: 20px; }}
        h1 {{ color: #112358; }}
        .status {{ padding: 20px; border-radius: 8px; background: {status_color}; color: white; font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; }}
        .metric {{ background: #f7fafc; padding: 15px; border-radius: 8px; margin: 10px 0; }}
        .metric-label {{ color: #718096; font-size: 14px; }}
        .metric-value {{ font-size: 28px; font-weight: bold; color: #112358; }}
        .info {{ background: #e6f7ff; border-left: 4px solid #1890ff; padding: 12px; margin: 15px 0; }}
    </style>
</head>
<body>
    <h1>EU AI Act Compliance Report</h1>
    <p><strong>Generated:</strong> {data["audit_timestamp"]}</p>

    <div class="status">Article 15: {status_text}</div>

    <h2>Accuracy Metrics</h2>
    <div class="metric">
        <div class="metric-label">Accuracy Rate</div>
        <div class="metric-value">{article_15["accuracy"]:.1%}</div>
    </div>
    <div class="metric">
        <div class="metric-label">Threshold Required</div>
        <div class="metric-value">{article_15["threshold"]:.0%}</div>
    </div>
    <div class="metric">
        <div class="metric-label">Total Traces</div>
        <div class="metric-value">{article_15["total_traces"]}</div>
    </div>
    <div class="metric">
        <div class="metric-label">Passed / Failed</div>
        <div class="metric-value">{article_15["passed_traces"]} / {article_15["failed_traces"]}</div>
    </div>

    <div class="info">
        <strong>Evaluator:</strong> {article_15["evaluator_type"]}<br>
        <strong>Method:</strong> {article_15["evaluator_description"]}
    </div>

    <hr style="margin: 40px 0; border: none; border-top: 1px solid #e2e8f0;">
    <p style="color: #718096; font-size: 14px;">Generated with CERT Framework - EU AI Act Compliance Toolkit</p>
</body>
</html>"""
    return html


# Register new compliance commands
try:
    from cert.cli.audit import audit_status
    from cert.cli.classify import classify_system
    from cert.cli.generate import generate_docs

    cli.add_command(classify_system)
    cli.add_command(generate_docs)
    cli.add_command(audit_status)
except ImportError:
    # Commands will not be available if dependencies missing
    pass


if __name__ == "__main__":
    cli()
