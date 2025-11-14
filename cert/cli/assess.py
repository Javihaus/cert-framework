"""
CERT Assessment CLI Commands
=============================

Command-line interface for AI readiness assessment.
"""

import json
import sys

import click


@click.command(name="assess")
@click.option("--interactive", "-i", is_flag=True, help="Run interactive questionnaire")
@click.option(
    "--output",
    "-o",
    default="assessment_report.json",
    help="Output file path (default: assessment_report.json)",
)
@click.option(
    "--format",
    "-f",
    type=click.Choice(["json", "txt"], case_sensitive=False),
    default="json",
    help="Output format (json or txt)",
)
@click.option("--risk-only", is_flag=True, help="Only assess risk classification (skip readiness)")
@click.option(
    "--readiness-only", is_flag=True, help="Only assess readiness (skip risk classification)"
)
def assess_cmd(interactive, output, format, risk_only, readiness_only):
    """
    Run AI readiness assessment.

    This tool evaluates your AI system against EU AI Act requirements
    and assesses your organization's compliance readiness.

    Examples:
        cert assess --interactive
        cert assess -i --output my_report.json
        cert assess -i --format txt --output report.txt
        cert assess --risk-only -i
    """
    from cert.assessment.classifier import classify_risk
    from cert.assessment.questionnaire import (
        ANNEX_III_QUESTIONS,
        READINESS_QUESTIONS,
        calculate_risk_score,
        run_interactive_questionnaire,
    )
    from cert.assessment.readiness import assess_readiness
    from cert.assessment.report_generator import generate_report, save_report

    if not interactive:
        click.echo("Error: Currently only interactive mode is supported.")
        click.echo("Use --interactive or -i flag to run the assessment.")
        sys.exit(1)

    click.echo("\n" + "=" * 70)
    click.echo("CERT AI READINESS ASSESSMENT".center(70))
    click.echo("=" * 70)
    click.echo("\nThis assessment consists of two parts:")
    click.echo("1. Risk Classification (EU AI Act compliance)")

    if not risk_only:
        click.echo("2. Readiness Assessment (organizational capabilities)")

    click.echo("\nEstimated time: 10-15 minutes")
    click.echo("")

    if not click.confirm("Ready to begin?", default=True):
        click.echo("Assessment cancelled.")
        sys.exit(0)

    # Part 1: Risk Classification
    risk_answers = {}
    if not readiness_only:
        click.echo("\n" + "=" * 70)
        click.echo("PART 1: RISK CLASSIFICATION".center(70))
        click.echo("=" * 70)
        click.echo("\nThese questions determine your AI system's risk level")
        click.echo("according to the EU AI Act.")
        click.echo("")

        risk_answers = run_interactive_questionnaire(ANNEX_III_QUESTIONS, "Risk Classification")

        # Calculate risk
        risk_score = calculate_risk_score(risk_answers)
        risk_level = classify_risk(risk_score)

        click.echo(f"\n📊 Risk Score: {risk_score}")
        click.echo(f"🏷️  Risk Level: {risk_level}")

        if risk_level == "PROHIBITED":
            click.echo("\n⛔ WARNING: Your AI system may fall under prohibited use cases!")
            click.echo("    Please consult with legal counsel immediately.")
        elif risk_level == "HIGH_RISK":
            click.echo("\n⚠️  Your AI system is classified as HIGH-RISK")
            click.echo("   Comprehensive compliance measures are required.")

    # Part 2: Readiness Assessment
    readiness_answers = {}
    readiness_scores = {}

    if not risk_only:
        click.echo("\n" + "=" * 70)
        click.echo("PART 2: READINESS ASSESSMENT".center(70))
        click.echo("=" * 70)
        click.echo("\nThese questions assess your organization's readiness")
        click.echo("for AI compliance and governance.")
        click.echo("")

        # Collect readiness questions from all dimensions
        all_readiness_questions = []
        for dimension_questions in READINESS_QUESTIONS.values():
            all_readiness_questions.extend(dimension_questions)

        readiness_answers = run_interactive_questionnaire(
            all_readiness_questions, "Readiness Assessment"
        )

        # Calculate readiness scores
        readiness_scores = assess_readiness(readiness_answers)

        click.echo(f"\n📊 Overall Readiness Score: {readiness_scores['overall']:.1f}/100")

        # Show dimension scores
        click.echo("\nScores by Dimension:")
        for dimension, score in readiness_scores.items():
            if dimension != "overall":
                emoji = "✅" if score >= 70 else "⚠️" if score >= 50 else "❌"
                click.echo(f"  {emoji} {dimension.replace('_', ' ').title()}: {score:.1f}/100")

    # Generate full report
    if not readiness_only and not risk_only:
        click.echo("\n\n" + "=" * 70)
        click.echo("GENERATING REPORT".center(70))
        click.echo("=" * 70)

        all_answers = {**risk_answers, **readiness_answers}
        report = generate_report(risk_level, readiness_scores, all_answers)

        # Save report
        save_report(report, output, format)

        click.echo(f"\n✅ Report saved to: {output}")
        click.echo(f"   Format: {format.upper()}")

        # Display key findings
        click.echo("\n" + "=" * 70)
        click.echo("KEY FINDINGS".center(70))
        click.echo("=" * 70)

        click.echo(f"\n🏷️  Risk Level: {risk_level}")
        click.echo(f"📊 Readiness Score: {readiness_scores['overall']:.1f}/100")

        # Timeline and cost
        timeline = report["timeline_cost"]["estimated_timeline"]
        cost = report["timeline_cost"]["estimated_cost"]

        click.echo(f"\n⏱️  Estimated Timeline: {timeline['description']}")
        click.echo(f"💰 Estimated Cost: {cost['description']}")

        # Top priority actions
        if "recommendations" in report:
            click.echo("\n🎯 TOP PRIORITY ACTIONS:")
            for i, action in enumerate(report["recommendations"]["priority_actions"][:5], 1):
                click.echo(f"   {i}. {action}")

        # CTA
        cta = report["next_actions"]
        click.echo("\n" + "=" * 70)
        click.echo(cta["message"])
        click.echo(f"Contact: {cta['contact_url']}")
        click.echo("=" * 70 + "\n")

    elif risk_only:
        # Save risk-only report
        mini_report = {
            "risk_classification": {
                "level": risk_level,
                "score": calculate_risk_score(risk_answers),
            },
            "answers": risk_answers,
        }
        with open(output, "w") as f:
            json.dump(mini_report, f, indent=2)
        click.echo(f"\n✅ Risk assessment saved to: {output}")

    elif readiness_only:
        # Save readiness-only report
        mini_report = {"readiness_scores": readiness_scores, "answers": readiness_answers}
        with open(output, "w") as f:
            json.dump(mini_report, f, indent=2)
        click.echo(f"\n✅ Readiness assessment saved to: {output}")


@click.command(name="assess-risk")
@click.option("--interactive", "-i", is_flag=True, help="Run interactive questionnaire")
@click.option("--output", "-o", default="risk_assessment.json", help="Output file path")
def assess_risk_cmd(interactive, output):
    """
    Quick risk classification assessment.

    Evaluates your AI system against EU AI Act risk categories.

    Example:
        cert assess-risk --interactive
    """
    # This is a shortcut to assess --risk-only
    from click import Context

    ctx = Context(assess_cmd)
    ctx.invoke(
        assess_cmd,
        interactive=interactive,
        output=output,
        format="json",
        risk_only=True,
        readiness_only=False,
    )


@click.command(name="assess-readiness")
@click.option("--interactive", "-i", is_flag=True, help="Run interactive questionnaire")
@click.option("--output", "-o", default="readiness_assessment.json", help="Output file path")
def assess_readiness_cmd(interactive, output):
    """
    Quick readiness assessment.

    Evaluates your organization's compliance readiness.

    Example:
        cert assess-readiness --interactive
    """
    # This is a shortcut to assess --readiness-only
    from click import Context

    ctx = Context(assess_cmd)
    ctx.invoke(
        assess_cmd,
        interactive=interactive,
        output=output,
        format="json",
        risk_only=False,
        readiness_only=True,
    )


def register_assessment_commands(cli_group):
    """
    Register assessment commands with main CLI group.

    Args:
        cli_group: Click group to register commands with
    """
    cli_group.add_command(assess_cmd)
    cli_group.add_command(assess_risk_cmd)
    cli_group.add_command(assess_readiness_cmd)
