"""
CERT Health Check CLI Commands
===============================

Commands for checking connector health and system status.
"""

import click
import json


@click.command(name="health")
@click.option("--format", "-f", type=click.Choice(["json", "text"]), default="text")
@click.option("--verbose", "-v", is_flag=True, help="Show detailed information")
def health_cmd(format, verbose):
    """
    Check CERT connector health status.

    Example:
        cert health
        cert health --format json --verbose
    """
    from cert.integrations.registry import (
        get_connector_status,
        check_connector_health,
        get_active_connectors,
    )
    from cert.integrations.performance import get_performance_monitor

    # Get connector health
    health_status = check_connector_health()
    connector_status = get_connector_status()
    active_connectors = get_active_connectors()

    # Get performance metrics
    perf_monitor = get_performance_monitor()
    perf_summary = perf_monitor.get_summary() if perf_monitor.enabled else None

    if format == "json":
        output = {
            "overall_health": health_status,
            "connectors": connector_status,
            "performance": perf_summary,
        }
        click.echo(json.dumps(output, indent=2))
    else:
        # Text format
        click.echo(f"\n{'=' * 60}")
        click.echo("CERT CONNECTOR HEALTH CHECK".center(60))
        click.echo(f"{'=' * 60}\n")

        # Overall health
        health_pct = health_status["health_percentage"]
        health_emoji = "✅" if health_pct == 100 else "⚠️" if health_pct >= 50 else "❌"

        click.echo(f"{health_emoji} Overall Health: {health_pct:.0f}%")
        click.echo(f"   Total Connectors: {health_status['total_connectors']}")
        click.echo(f"   Healthy: {health_status['healthy']}")
        click.echo(f"   Unhealthy: {health_status['unhealthy']}\n")

        # Per-connector status
        if connector_status:
            click.echo("Connector Status:")
            for conn in connector_status:
                status_emoji = "✅" if conn["healthy"] else "❌"
                enabled_str = "enabled" if conn["enabled"] else "disabled"

                click.echo(f"  {status_emoji} {conn['name']}: {enabled_str}")

                if verbose:
                    click.echo(f"     Failure count: {conn['failure_count']}")
        else:
            click.echo("⚠️  No connectors activated")

        # Performance metrics
        if perf_summary and perf_summary.get("total_calls", 0) > 0:
            click.echo(f"\nPerformance Metrics:")
            click.echo(f"  Total Calls: {perf_summary['total_calls']}")
            click.echo(f"  Average Overhead: {perf_summary['overall_average_ms']:.2f}ms")
            click.echo(f"  Median Overhead: {perf_summary['overall_median_ms']:.2f}ms")
            click.echo(f"  P95 Overhead: {perf_summary['overall_p95_ms']:.2f}ms")

            if perf_summary['connectors_exceeding_target']:
                click.echo(f"\n  ⚠️  Connectors exceeding 5ms target:")
                for name in perf_summary['connectors_exceeding_target']:
                    conn_metrics = perf_summary['by_connector'][name]
                    click.echo(f"     - {name}: {conn_metrics['average_overhead_ms']:.2f}ms")

            if verbose:
                click.echo(f"\n  Per-Connector Performance:")
                for name, metrics in perf_summary['by_connector'].items():
                    click.echo(f"     {name}:")
                    click.echo(f"       Calls: {metrics['call_count']}")
                    click.echo(f"       Avg: {metrics['average_overhead_ms']:.2f}ms")
                    click.echo(f"       P95: {metrics['p95_overhead_ms']:.2f}ms")

        click.echo()


@click.command(name="reset-health")
@click.option("--connector", "-c", help="Reset specific connector (or all if not specified)")
def reset_health_cmd(connector):
    """
    Reset connector circuit breakers.

    Example:
        cert reset-health                    # Reset all
        cert reset-health --connector openai  # Reset specific
    """
    from cert.integrations.registry import (
        reset_all_circuit_breakers,
        find_connector_by_platform,
    )

    if connector:
        conn = find_connector_by_platform(connector)
        if conn:
            conn.reset_circuit_breaker()
            click.echo(f"✅ Reset circuit breaker for {connector}")
        else:
            click.echo(f"❌ Connector '{connector}' not found", err=True)
    else:
        reset_all_circuit_breakers()
        click.echo("✅ Reset all connector circuit breakers")


@click.command(name="perf")
@click.argument("traces_file", type=click.Path(exists=True), required=False)
@click.option("--enable", is_flag=True, help="Enable performance monitoring")
@click.option("--disable", is_flag=True, help="Disable performance monitoring")
@click.option("--reset", is_flag=True, help="Reset performance metrics")
@click.option("--format", "-f", type=click.Choice(["json", "text"]), default="text")
def perf_cmd(traces_file, enable, disable, reset, format):
    """
    View and manage performance metrics.

    Example:
        cert perf --enable                 # Enable monitoring
        cert perf                          # View current metrics
        cert perf --format json            # JSON output
        cert perf --reset                  # Reset metrics
    """
    from cert.integrations.performance import get_performance_monitor

    monitor = get_performance_monitor()

    if enable:
        monitor.enable()
        click.echo("✅ Performance monitoring enabled")
        return

    if disable:
        monitor.disable()
        click.echo("✅ Performance monitoring disabled")
        return

    if reset:
        monitor.reset()
        click.echo("✅ Performance metrics reset")
        return

    # Show metrics
    summary = monitor.get_summary()

    if format == "json":
        click.echo(json.dumps(summary, indent=2))
    else:
        if "message" in summary:
            click.echo(f"ℹ️  {summary['message']}")
            return

        click.echo(f"\n{'=' * 60}")
        click.echo("PERFORMANCE METRICS".center(60))
        click.echo(f"{'=' * 60}\n")

        click.echo(f"Total Calls: {summary['total_calls']}")
        click.echo(f"Connectors: {summary['connector_count']}\n")

        click.echo(f"Overall Overhead:")
        click.echo(f"  Average: {summary['overall_average_ms']:.2f}ms")
        click.echo(f"  Median:  {summary['overall_median_ms']:.2f}ms")
        click.echo(f"  P95:     {summary['overall_p95_ms']:.2f}ms\n")

        if summary['connectors_exceeding_target']:
            click.echo(f"⚠️  Connectors Exceeding 5ms Target:")
            for name in summary['connectors_exceeding_target']:
                metrics = summary['by_connector'][name]
                click.echo(f"  - {name}: {metrics['average_overhead_ms']:.2f}ms")
            click.echo()

        click.echo("Per-Connector Metrics:")
        for name, metrics in summary['by_connector'].items():
            status = "⚠️" if metrics['exceeds_target'] else "✅"
            click.echo(f"  {status} {name}:")
            click.echo(f"     Calls:   {metrics['call_count']}")
            click.echo(f"     Average: {metrics['average_overhead_ms']:.2f}ms")
            click.echo(f"     Median:  {metrics['median_overhead_ms']:.2f}ms")
            click.echo(f"     P95:     {metrics['p95_overhead_ms']:.2f}ms")
            click.echo(f"     Range:   {metrics['min_overhead_ms']:.2f}-{metrics['max_overhead_ms']:.2f}ms\n")


def register_health_commands(cli_group):
    """
    Register health commands with main CLI group.

    Args:
        cli_group: Click group to register commands with
    """
    cli_group.add_command(health_cmd)
    cli_group.add_command(reset_health_cmd)
    cli_group.add_command(perf_cmd)
