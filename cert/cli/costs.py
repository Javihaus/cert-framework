"""
CERT Cost Analysis CLI Commands
================================

Command-line interface for cost analysis and ROI calculation.
"""

import json
from datetime import datetime, timedelta

import click


@click.command(name="costs")
@click.argument("traces_file", type=click.Path(exists=True))
@click.option("--days", "-d", default=30, help="Number of days to analyze")
@click.option("--format", "-f", type=click.Choice(["json", "text"]), default="text")
def costs_cmd(traces_file, days, format):
    """
    Analyze AI/LLM costs from trace files.

    Example:
        cert costs production.jsonl --days 30
    """
    from cert.value import CostAnalyzer

    analyzer = CostAnalyzer(traces_file)
    summary = analyzer.get_summary(days=days)

    if format == "json":
        click.echo(json.dumps(summary, indent=2))
    else:
        # Text format
        click.echo(f"\n{'=' * 60}")
        click.echo(f"COST ANALYSIS - Last {days} Days".center(60))
        click.echo(f"{'=' * 60}\n")

        costs = summary["costs"]
        click.echo(f"Total Spend: ${costs['total']:.2f}")
        click.echo(f"Daily Average: ${costs['daily_average']:.2f}")
        click.echo(f"Monthly Projection: ${costs['monthly_projection']:.2f}\n")

        # Warn if no cost data found
        if costs["total"] == 0:
            click.echo("⚠️  Warning: No cost data found in traces.", err=True)
            click.echo(
                "   Ensure your traces include 'cost' field or use auto-instrumentation", err=True
            )
            click.echo("   with: import cert.integrations.auto", err=True)
            click.echo()

        click.echo("Top Models by Cost:")
        for i, (model, cost) in enumerate(list(summary["by_model"].items())[:5], 1):
            percentage = (cost / costs["total"] * 100) if costs["total"] > 0 else 0
            click.echo(f"  {i}. {model}: ${cost:.2f} ({percentage:.1f}%)")

        if summary["anomalies"]:
            click.echo(f"\n⚠️  {len(summary['anomalies'])} Cost Anomalies Detected:")
            for anomaly in summary["anomalies"][:3]:
                click.echo(
                    f"  - {anomaly['date']}: ${anomaly['cost']:.2f} "
                    f"({anomaly['percent_increase']:.0f}% above average)"
                )


@click.command(name="roi")
@click.argument("traces_file", type=click.Path(exists=True))
@click.option(
    "--value-per-task",
    "-v",
    type=float,
    required=True,
    help="Business value per successful task (USD)",
)
@click.option("--days", "-d", default=30, help="Number of days to analyze")
def roi_cmd(traces_file, value_per_task, days):
    """
    Calculate ROI from AI/LLM system.

    Example:
        cert roi production.jsonl --value-per-task 2.50 --days 30
    """
    from cert.value import ROICalculator

    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    calculator = ROICalculator(traces_file, business_value_per_task=value_per_task)
    roi = calculator.calculate_roi(start_date=start_date, end_date=end_date)

    click.echo(f"\n{'=' * 60}")
    click.echo(f"ROI ANALYSIS - Last {days} Days".center(60))
    click.echo(f"{'=' * 60}\n")

    click.echo(f"Total Cost: ${roi['costs']['total']:.2f}")
    click.echo(f"Total Value: ${roi['value']['total']:.2f}")
    click.echo(f"Net Value: ${roi['roi']['net_value']:.2f}\n")

    click.echo(f"ROI: {roi['roi']['percentage']:.1f}%")
    click.echo(f"Successful Tasks: {roi['value']['successful_tasks']}")
    click.echo(f"Cost per Task: ${roi['costs']['per_task']:.4f}")
    click.echo(f"Value per Task: ${roi['value']['per_task']:.2f}\n")

    if roi["roi"]["payback_months"]:
        click.echo(f"Payback Period: {roi['roi']['payback_months']:.1f} months")


@click.command(name="optimize")
@click.argument("traces_file", type=click.Path(exists=True))
@click.option("--format", "-f", type=click.Choice(["json", "text"]), default="text")
def optimize_cmd(traces_file, format):
    """
    Find cost optimization opportunities.

    Example:
        cert optimize production.jsonl
    """
    from cert.value import Optimizer

    optimizer = Optimizer(traces_file)
    summary = optimizer.get_optimization_summary()

    if format == "json":
        click.echo(json.dumps(summary, indent=2))
    else:
        click.echo(f"\n{'=' * 60}")
        click.echo("OPTIMIZATION OPPORTUNITIES".center(60))
        click.echo(f"{'=' * 60}\n")

        click.echo(f"Current Monthly Cost: ${summary['current_monthly_cost']:.2f}")
        click.echo(f"Total Potential Savings: ${summary['total_potential_savings']:.2f}")
        click.echo(f"Savings Percentage: {summary['potential_savings_percentage']:.1f}%\n")

        opts = summary["optimizations"]

        if opts["model_downgrades"]["count"] > 0:
            click.echo(f"🔄 Model Downgrades ({opts['model_downgrades']['count']} opportunities):")
            click.echo(f"   Potential savings: ${opts['model_downgrades']['savings']:.2f}/month\n")
            for opp in opts["model_downgrades"]["top_opportunities"]:
                click.echo(
                    f"   • {opp['current_model']} → {', '.join(opp['recommended_models'][:2])}"
                )
                click.echo(
                    f"     Savings: ${opp['estimated_savings']:.2f} ({opp['task_count']} tasks)\n"
                )

        if opts["caching"]["count"] > 0:
            click.echo(f"💾 Caching Opportunities ({opts['caching']['count']} found):")
            click.echo(f"   Potential savings: ${opts['caching']['savings']:.2f}/month\n")
            for opp in opts["caching"]["top_opportunities"][:2]:
                click.echo(f"   • {opp['repetitions']} repetitions")
                click.echo(f"     Savings: ${opp['potential_savings']:.2f}\n")


def register_value_commands(cli_group):
    """
    Register value/cost commands with main CLI group.

    Args:
        cli_group: Click group to register commands with
    """
    cli_group.add_command(costs_cmd)
    cli_group.add_command(roi_cmd)
    cli_group.add_command(optimize_cmd)
