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
