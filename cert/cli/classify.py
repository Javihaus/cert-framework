"""
Risk classification command for EU AI Act Annex III.
Helps determine if your AI system is high-risk.
"""

import json
from pathlib import Path

import click


def load_risk_questions():
    """Load risk questions from JSON file."""
    questions_path = Path(__file__).parent / "risk_questions.json"
    with open(questions_path) as f:
        return json.load(f)


@click.command(name="classify-system")
@click.option(
    "--output",
    "-o",
    type=click.Path(),
    help="Save classification result to JSON file",
)
@click.option(
    "--non-interactive",
    is_flag=True,
    help="Skip interactive questions (for testing)",
)
def classify_system(output, non_interactive):
    """Classify your AI system's risk level per EU AI Act Annex III.

    This interactive command asks 10 questions to determine if your
    AI system is high-risk under the EU AI Act.

    Examples:
        cert classify-system
        cert classify-system --output classification.json
    """
    data = load_risk_questions()
    questions = data["questions"]
    risk_levels = data["risk_levels"]

    click.echo("=" * 70)
    click.echo("EU AI Act Risk Classification (Annex III)")
    click.echo("=" * 70)
    click.echo()
    click.echo("This tool will ask 10 questions to determine if your AI system")
    click.echo("is classified as high-risk under the EU AI Act.")
    click.echo()
    click.echo("Answer 'y' for yes, 'n' for no, or 's' to skip a question.")
    click.echo()

    if non_interactive:
        click.echo("Running in non-interactive mode (all answers: no)")
        answers = {q["id"]: False for q in questions}
    else:
        answers = {}

        for i, question in enumerate(questions, 1):
            click.echo(f"Question {i}/{len(questions)}")
            click.echo("-" * 70)
            click.echo(f"{question['text']}")
            click.echo()
            click.echo(f"Reference: {question['annex_reference']}")
            click.echo(f"Category: {question['category']}")
            click.echo()
            click.echo("Examples:")
            for example in question["examples"]:
                click.echo(f"  • {example}")
            click.echo()

            while True:
                answer = click.prompt(
                    "Does this apply to your system? (y/n/s)",
                    type=str,
                    default="n",
                ).lower()

                if answer in ["y", "yes"]:
                    answers[question["id"]] = True
                    break
                elif answer in ["n", "no"]:
                    answers[question["id"]] = False
                    break
                elif answer in ["s", "skip"]:
                    answers[question["id"]] = None
                    break
                else:
                    click.echo("Please answer 'y', 'n', or 's'")

            click.echo()

    # Count yes answers
    yes_count = sum(1 for v in answers.values() if v is True)

    # Determine risk level
    if yes_count == 0:
        risk_level = risk_levels["no_answers"]
    elif yes_count <= 2:
        risk_level = risk_levels["1_to_2_answers"]
    else:
        risk_level = risk_levels["3_or_more_answers"]

    # Display results
    click.echo("=" * 70)
    click.echo("CLASSIFICATION RESULT")
    click.echo("=" * 70)
    click.echo()
    click.echo(f"Risk Level: {risk_level['title']}")
    click.echo(f"High-Risk Indicators: {yes_count}/10")
    click.echo()
    click.echo(f"Description: {risk_level['description']}")
    click.echo()
    click.echo("Requirements:")
    for req in risk_level["requirements"]:
        click.echo(f"  • {req}")
    click.echo()

    # Show which questions were answered yes
    if yes_count > 0:
        click.echo("Your system matched these high-risk categories:")
        for question in questions:
            if answers.get(question["id"]) is True:
                click.echo(f"  • {question['category']}: {question['annex_reference']}")
        click.echo()

    # Create result object
    result = {
        "classification": {
            "risk_level": risk_level["level"],
            "title": risk_level["title"],
            "description": risk_level["description"],
            "high_risk_indicators": yes_count,
            "total_questions": len(questions),
        },
        "requirements": risk_level["requirements"],
        "matched_categories": [
            {
                "category": q["category"],
                "annex_reference": q["annex_reference"],
                "question": q["text"],
            }
            for q in questions
            if answers.get(q["id"]) is True
        ],
        "answers": {
            q["id"]: {
                "question": q["text"],
                "answer": answers.get(q["id"]),
                "category": q["category"],
            }
            for q in questions
        },
    }

    # Save to file if requested
    if output:
        with open(output, "w") as f:
            json.dump(result, f, indent=2)
        click.echo(f"✓ Classification saved to {output}")

    # Return appropriate exit code
    if risk_level["level"] == "high":
        click.echo()
        click.echo("⚠️  Your system is HIGH-RISK. Full compliance required before market placement.")
        return 0  # Still return 0 for successful execution
    elif risk_level["level"] == "limited":
        click.echo()
        click.echo("⚠️  Your system has limited risk characteristics. Consider voluntary compliance.")
        return 0
    else:
        click.echo()
        click.echo("✓ Your system is minimal risk. Basic transparency obligations apply.")
        return 0


if __name__ == "__main__":
    classify_system()
