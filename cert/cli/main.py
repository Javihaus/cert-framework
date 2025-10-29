"""
CERT Framework CLI - Command-line interface for LLM monitoring and compliance.

Provides tools for:
- Generating EU AI Act compliance reports
- Evaluating traces offline
- Viewing and analyzing trace logs
"""

import json
import sys
from pathlib import Path

try:
    import click
except ImportError:
    print("Error: Click is required for CLI tools")
    print("Install with: pip install cert-framework[cli]")
    sys.exit(1)


@click.group()
@click.version_option()
def cli():
    """CERT Framework - LLM Monitoring & EU AI Act Compliance.

    Lightweight monitoring with automated Article 15 compliance documentation.

    \b
    Quick Start:
        cert evaluate traces.jsonl --preset financial
        cert report traces.jsonl -o report.pdf --system-name "My RAG System"
        cert logs traces.jsonl --tail 20
    """
    pass


@cli.command()
@click.argument('log_path', type=click.Path(exists=True))
@click.option('--output', '-o', default='compliance_report.md',
              help='Output path for report')
@click.option('--format', '-f',
              type=click.Choice(['markdown', 'html', 'pdf', 'txt']),
              default='markdown',
              help='Report format')
@click.option('--system-name', required=True,
              help='Name of the AI system')
@click.option('--risk-level',
              type=click.Choice(['high', 'medium', 'low']),
              default='high',
              help='Risk classification of the system')
@click.option('--eval-results',
              type=click.Path(exists=True),
              help='Path to evaluation results JSON (optional)')
def report(log_path, output, format, system_name, risk_level, eval_results):
    """Generate EU AI Act compliance report from trace logs.

    Creates a compliance report documenting accuracy levels (Article 15.1),
    error resilience (Article 15.4), and record keeping (Article 19).

    \b
    Examples:
        # Generate markdown report
        cert report traces.jsonl -o report.md --system-name "RAG System"

        # Generate PDF with evaluation results
        cert report traces.jsonl -o report.pdf -f pdf \\
            --system-name "Clinical AI" \\
            --eval-results eval.json
    """
    try:
        from cert.compliance.reporter import ComplianceReporter
    except ImportError:
        click.echo("Error: Compliance reporting requires: pip install cert-framework[compliance]",
                   err=True)
        sys.exit(1)

    click.echo(f"Generating {format} compliance report...")
    click.echo(f"  Log file: {log_path}")
    click.echo(f"  System: {system_name} (risk level: {risk_level})")

    # Load evaluation results if provided
    evaluation_results = None
    if eval_results:
        with open(eval_results) as f:
            evaluation_results = json.load(f)
        click.echo(f"  Evaluation results: {eval_results}")

    # Generate report
    reporter = ComplianceReporter(
        system_name=system_name,
        risk_level=risk_level
    )

    try:
        output_path = reporter.generate_report(
            log_path=log_path,
            output_path=output,
            format=format,
            evaluation_results=evaluation_results
        )
        click.echo(f"\n✓ Report generated: {output_path}")
    except Exception as e:
        click.echo(f"\n✗ Error generating report: {e}", err=True)
        sys.exit(1)


@cli.command()
@click.argument('log_path', type=click.Path(exists=True))
@click.option('--preset', default='general',
              help='Evaluation preset (general, financial, healthcare, legal)')
@click.option('--threshold', type=float, default=0.7,
              help='Confidence threshold for pass/fail')
@click.option('--output', '-o',
              help='Output path for results JSON')
def evaluate(log_path, preset, threshold, output):
    """Evaluate traces offline with accuracy measurements.

    Processes trace logs with semantic similarity, NLI contradiction detection,
    and term grounding analysis. Results include pass/fail rates and detailed
    metrics for each trace.

    \b
    Examples:
        # Evaluate with financial preset
        cert evaluate traces.jsonl --preset financial --threshold 0.8

        # Save results to JSON
        cert evaluate traces.jsonl --output results.json
    """
    try:
        from cert.evaluation import Evaluator
    except ImportError:
        click.echo("Error: Evaluation requires: pip install cert-framework[evaluation]",
                   err=True)
        sys.exit(1)

    click.echo(f"Evaluating traces with preset={preset}, threshold={threshold}...")
    click.echo(f"  Log file: {log_path}")

    evaluator = Evaluator(preset=preset, threshold=threshold)

    try:
        results = evaluator.evaluate_log_file(log_path)

        # Display results
        click.echo(f"\n📊 Evaluation Results:")
        click.echo(f"  Total traces: {results['total_traces']}")
        click.echo(f"  Passed: {results['passed']} ({results['passed']/results['total_traces']*100:.1f}%)")
        click.echo(f"  Failed: {results['failed']} ({results['failed']/results['total_traces']*100:.1f}%)")
        click.echo(f"  Pass rate: {results['pass_rate']:.1%}")

        if results['traces_skipped'] > 0:
            click.echo(f"  Skipped: {results['traces_skipped']} (missing context/answer)")

        # Save results if output specified
        if output:
            with open(output, 'w') as f:
                json.dump(results, f, indent=2)
            click.echo(f"\n✓ Results saved: {output}")

    except Exception as e:
        click.echo(f"\n✗ Error evaluating traces: {e}", err=True)
        import traceback
        traceback.print_exc()
        sys.exit(1)


@cli.command()
@click.argument('log_path', type=click.Path(exists=True))
@click.option('--tail', '-n', type=int, default=10,
              help='Number of recent traces to show')
@click.option('--filter-function',
              help='Filter by function name')
@click.option('--filter-status',
              type=click.Choice(['success', 'error']),
              help='Filter by status')
@click.option('--json-output', is_flag=True,
              help='Output as JSON')
def logs(log_path, tail, filter_function, filter_status, json_output):
    """View recent traces from log file.

    Displays a summary of recent trace logs with timestamps, function names,
    durations, and status. Useful for quick inspection of monitoring data.

    \b
    Examples:
        # View last 20 traces
        cert logs traces.jsonl --tail 20

        # Filter by function name
        cert logs traces.jsonl --filter-function my_rag_pipeline

        # Filter errors only
        cert logs traces.jsonl --filter-status error

        # Output as JSON
        cert logs traces.jsonl --json-output
    """
    log_file = Path(log_path)
    if not log_file.exists():
        click.echo(f"Error: Log file not found: {log_path}", err=True)
        sys.exit(1)

    # Load traces
    traces = []
    with open(log_file) as f:
        for line in f:
            try:
                trace = json.loads(line)

                # Apply filters
                if filter_function and trace.get('function') != filter_function:
                    continue
                if filter_status and trace.get('status') != filter_status:
                    continue

                traces.append(trace)
            except json.JSONDecodeError:
                continue

    # Get recent traces
    recent_traces = traces[-tail:] if len(traces) > tail else traces

    if not recent_traces:
        click.echo("No traces found matching criteria")
        return

    # Output
    if json_output:
        click.echo(json.dumps(recent_traces, indent=2))
    else:
        click.echo(f"\n📋 Last {len(recent_traces)} traces:\n")

        for trace in recent_traces:
            status_icon = "✓" if trace.get("status") == "success" else "✗"
            timestamp = trace.get("timestamp", "N/A")
            function = trace.get("function", "unknown")
            duration = trace.get("duration_ms", 0)

            click.echo(f"{status_icon} {timestamp} | {function} | {duration:.1f}ms")

            # Show error if present
            if trace.get("error"):
                click.echo(f"   Error: {trace['error']}")


@cli.command()
@click.argument('log_path', type=click.Path(exists=True))
def stats(log_path):
    """Show statistics about trace logs.

    Displays aggregate statistics including total requests, success/error rates,
    average duration, and time period covered by the logs.

    \b
    Example:
        cert stats traces.jsonl
    """
    log_file = Path(log_path)
    if not log_file.exists():
        click.echo(f"Error: Log file not found: {log_path}", err=True)
        sys.exit(1)

    # Collect statistics
    traces = []
    with open(log_file) as f:
        for line in f:
            try:
                traces.append(json.loads(line))
            except json.JSONDecodeError:
                continue

    if not traces:
        click.echo("No valid traces found")
        return

    # Compute stats
    total = len(traces)
    successes = sum(1 for t in traces if t.get("status") == "success")
    errors = total - successes
    durations = [t.get("duration_ms", 0) for t in traces]
    timestamps = [t.get("timestamp") for t in traces if t.get("timestamp")]

    click.echo(f"\n📊 Trace Log Statistics:\n")
    click.echo(f"  Total requests: {total:,}")
    click.echo(f"  Successful: {successes:,} ({successes/total*100:.1f}%)")
    click.echo(f"  Errors: {errors:,} ({errors/total*100:.1f}%)")
    click.echo(f"  Avg duration: {sum(durations)/len(durations):.2f}ms")
    click.echo(f"  Min duration: {min(durations):.2f}ms")
    click.echo(f"  Max duration: {max(durations):.2f}ms")

    if timestamps:
        click.echo(f"\n  Period: {min(timestamps)} to {max(timestamps)}")

    # Function breakdown
    functions = {}
    for trace in traces:
        func = trace.get("function", "unknown")
        functions[func] = functions.get(func, 0) + 1

    click.echo(f"\n  Functions:")
    for func, count in sorted(functions.items(), key=lambda x: x[1], reverse=True):
        click.echo(f"    {func}: {count:,} calls")


def main():
    """Entry point for CLI."""
    cli()


if __name__ == '__main__':
    main()
