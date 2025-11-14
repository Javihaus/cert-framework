"""
Assessment Report Generator
===========================

This module generates comprehensive assessment reports combining
risk classification and readiness analysis.
"""

import json
from datetime import datetime
from typing import Any, Dict, List


def generate_report(
    risk_level: str,
    readiness_scores: Dict[str, float],
    answers: Dict[str, str],
    include_recommendations: bool = True,
) -> Dict[str, Any]:
    """
    Generate comprehensive assessment report.

    Args:
        risk_level: Risk classification result
        readiness_scores: Readiness scores by dimension
        answers: User's questionnaire answers
        include_recommendations: Whether to include recommendations

    Returns:
        Complete assessment report as dictionary
    """
    from cert.assessment.classifier import (
        analyze_prohibited_triggers,
        get_compliance_requirements,
        get_legal_basis,
        get_next_steps,
    )
    from cert.assessment.readiness import (
        calculate_readiness_percentile,
        generate_improvement_roadmap,
        identify_gaps,
    )

    # Identify gaps
    gaps = identify_gaps(readiness_scores)

    # Build report
    report = {
        "assessment_metadata": {
            "assessment_date": datetime.utcnow().isoformat() + "Z",
            "cert_version": "2.0",
            "report_version": "1.0",
        },
        "risk_classification": {
            "level": risk_level,
            "legal_basis": get_legal_basis(risk_level),
            "compliance_requirements": get_compliance_requirements(risk_level),
            "prohibited_triggers": analyze_prohibited_triggers(answers)
            if risk_level == "PROHIBITED"
            else [],
        },
        "readiness_assessment": {
            "scores": {k: round(v, 1) for k, v in readiness_scores.items()},
            "percentile": calculate_readiness_percentile(readiness_scores.get("overall", 0)),
            "gaps": gaps,
            "gap_count": {
                "critical": sum(1 for g in gaps if g["severity"] == "critical"),
                "high": sum(1 for g in gaps if g["severity"] == "high"),
                "medium": sum(1 for g in gaps if g["severity"] == "medium"),
            },
        },
        "timeline_cost": {
            "estimated_timeline": estimate_timeline(risk_level, readiness_scores.get("overall", 0)),
            "estimated_cost": estimate_cost(risk_level, readiness_scores.get("overall", 0)),
        },
    }

    # Add recommendations if requested
    if include_recommendations:
        report["recommendations"] = {
            "next_steps": get_next_steps(risk_level, readiness_scores.get("overall")),
            "improvement_roadmap": generate_improvement_roadmap(gaps),
            "priority_actions": get_priority_actions(risk_level, gaps),
        }

    # Add consultation CTA
    report["next_actions"] = generate_consultation_cta(risk_level)

    return report


def estimate_timeline(risk_level: str, readiness_score: float) -> Dict[str, Any]:
    """
    Estimate time to compliance readiness.

    Args:
        risk_level: Risk classification
        readiness_score: Overall readiness score

    Returns:
        Timeline estimate with breakdown
    """
    # Base timelines by risk level
    base_timelines = {
        "PROHIBITED": {
            "min_months": None,
            "max_months": None,
            "description": "N/A - Cannot deploy",
            "phases": [],
        },
        "HIGH_RISK": {
            "min_months": 6,
            "max_months": 12,
            "description": "6-12 months to full compliance",
            "phases": [
                "Documentation & Assessment (2-3 months)",
                "Implementation of Requirements (3-5 months)",
                "Testing & Validation (1-2 months)",
                "Conformity Assessment (1-2 months)",
            ],
        },
        "LIMITED_RISK": {
            "min_months": 1,
            "max_months": 3,
            "description": "1-3 months to compliance",
            "phases": [
                "Documentation (2-4 weeks)",
                "Implementation of Transparency (2-4 weeks)",
                "Review & Validation (1-2 weeks)",
            ],
        },
        "MINIMAL_RISK": {
            "min_months": 0,
            "max_months": 1,
            "description": "Immediate (optional improvements 0-1 month)",
            "phases": [
                "Best Practices Review (1-2 weeks)",
                "Optional Documentation (1-2 weeks)",
            ],
        },
    }

    timeline = base_timelines[risk_level].copy()

    # Adjust based on readiness score
    if risk_level in ["HIGH_RISK", "LIMITED_RISK"]:
        adjustment_factor = 1.0

        if readiness_score < 40:
            adjustment_factor = 1.5
            timeline["note"] = "Timeline extended due to low readiness scores"
        elif readiness_score < 60:
            adjustment_factor = 1.25
            timeline["note"] = "Timeline may require extension due to readiness gaps"
        elif readiness_score >= 80:
            adjustment_factor = 0.8
            timeline["note"] = "Timeline may be shorter due to high readiness"

        if timeline["min_months"] is not None:
            timeline["min_months"] = round(timeline["min_months"] * adjustment_factor)
            timeline["max_months"] = round(timeline["max_months"] * adjustment_factor)

    return timeline


def estimate_cost(risk_level: str, readiness_score: float) -> Dict[str, Any]:
    """
    Estimate compliance cost.

    Args:
        risk_level: Risk classification
        readiness_score: Overall readiness score

    Returns:
        Cost estimate with breakdown
    """
    # Base cost estimates by risk level (in USD)
    base_costs = {
        "PROHIBITED": {
            "min": 0,
            "max": 0,
            "currency": "USD",
            "description": "N/A - Redesign required",
            "breakdown": [],
        },
        "HIGH_RISK": {
            "min": 50000,
            "max": 500000,
            "currency": "USD",
            "description": "$50K-$500K (consulting + implementation + certification)",
            "breakdown": [
                "Legal & Compliance Consulting: $15K-$100K",
                "Technical Implementation: $20K-$250K",
                "Documentation & Processes: $5K-$50K",
                "Testing & Validation: $5K-$50K",
                "Conformity Assessment: $5K-$50K",
            ],
        },
        "LIMITED_RISK": {
            "min": 5000,
            "max": 25000,
            "currency": "USD",
            "description": "$5K-$25K (documentation + disclosure mechanisms)",
            "breakdown": [
                "Legal Review: $2K-$8K",
                "Implementation: $2K-$12K",
                "Documentation: $1K-$5K",
            ],
        },
        "MINIMAL_RISK": {
            "min": 0,
            "max": 5000,
            "currency": "USD",
            "description": "$0-$5K (optional improvements)",
            "breakdown": [
                "Best Practices Review: $0-$2K",
                "Optional Documentation: $0-$3K",
            ],
        },
    }

    cost = base_costs[risk_level].copy()

    # Adjust based on readiness score
    if risk_level in ["HIGH_RISK", "LIMITED_RISK"]:
        if readiness_score < 40:
            # Significant additional work needed
            cost["min"] = int(cost["min"] * 1.5)
            cost["max"] = int(cost["max"] * 1.5)
            cost["note"] = (
                "Higher costs due to low readiness - significant infrastructure work needed"
            )
        elif readiness_score < 60:
            cost["min"] = int(cost["min"] * 1.25)
            cost["max"] = int(cost["max"] * 1.25)
            cost["note"] = "Moderately higher costs due to readiness gaps"
        elif readiness_score >= 80:
            cost["min"] = int(cost["min"] * 0.75)
            cost["max"] = int(cost["max"] * 0.75)
            cost["note"] = "Lower costs due to strong existing foundation"

    return cost


def get_priority_actions(risk_level: str, gaps: List[Dict[str, Any]]) -> List[str]:
    """
    Get top 5 priority actions based on risk and gaps.

    Args:
        risk_level: Risk classification
        gaps: Identified gaps

    Returns:
        List of priority actions
    """
    actions = []

    # Risk-specific actions
    if risk_level == "PROHIBITED":
        actions = [
            "🛑 CRITICAL: Halt deployment immediately",
            "⚖️ Engage legal counsel specialized in EU AI Act",
            "🔄 Initiate system redesign to avoid prohibited uses",
            "📋 Document alternative approaches",
            "📞 Schedule consultation to discuss compliance path",
        ]
    elif risk_level == "HIGH_RISK":
        actions = [
            "📋 Begin technical documentation (Annex IV)",
            "⚖️ Establish risk management system",
            "👤 Design human oversight mechanisms",
            "📊 Implement data governance measures",
        ]

        # Add gap-specific actions
        for gap in gaps[:2]:  # Top 2 gaps
            if gap["recommended_actions"]:
                actions.append(gap["recommended_actions"][0])

    elif risk_level == "LIMITED_RISK":
        actions = [
            "💬 Implement user disclosure mechanisms",
            "📄 Document system capabilities and limitations",
            "📊 Set up basic monitoring",
        ]

        # Add gap-specific actions
        for gap in gaps[:2]:
            if gap["recommended_actions"]:
                actions.append(gap["recommended_actions"][0])

    else:  # MINIMAL_RISK
        actions = [
            "📖 Review voluntary codes of conduct",
            "🎯 Implement responsible AI best practices",
            "📊 Consider optional monitoring for quality",
        ]

    # Limit to top 5
    return actions[:5]


def generate_consultation_cta(risk_level: str) -> Dict[str, Any]:
    """
    Generate call-to-action for consultation based on risk level.

    Args:
        risk_level: Risk classification

    Returns:
        CTA information
    """
    ctas = {
        "PROHIBITED": {
            "urgency": "critical",
            "message": "Your AI system requires immediate legal review. Schedule an urgent consultation.",
            "cta_text": "Schedule Emergency Consultation",
            "recommended_service": "Legal compliance review + system redesign consultation",
            "estimated_engagement": "$15K-$50K",
        },
        "HIGH_RISK": {
            "urgency": "high",
            "message": "Your AI system requires comprehensive compliance work. Let us help you navigate the requirements.",
            "cta_text": "Schedule Compliance Consultation",
            "recommended_service": "Full compliance roadmap + implementation support",
            "estimated_engagement": "$10K-$30K initial consultation",
        },
        "LIMITED_RISK": {
            "urgency": "medium",
            "message": "Ensure your transparency obligations are met. We can help implement the requirements efficiently.",
            "cta_text": "Schedule Implementation Consultation",
            "recommended_service": "Transparency implementation + documentation review",
            "estimated_engagement": "$5K-$15K",
        },
        "MINIMAL_RISK": {
            "urgency": "low",
            "message": "While not required, best practices can improve your AI system. Consider a review.",
            "cta_text": "Schedule Optional Review",
            "recommended_service": "Best practices review + optional improvements",
            "estimated_engagement": "$2K-$8K",
        },
    }

    cta = ctas[risk_level].copy()
    cta["contact_url"] = "https://cert-framework.com/consult"

    return cta


def format_report_text(report: Dict[str, Any]) -> str:
    """
    Format report as human-readable text.

    Args:
        report: Report dictionary

    Returns:
        Formatted text report
    """
    lines = []

    # Header
    lines.append("=" * 70)
    lines.append("CERT AI READINESS ASSESSMENT REPORT".center(70))
    lines.append("=" * 70)
    lines.append("")

    # Assessment Date
    lines.append(f"Assessment Date: {report['assessment_metadata']['assessment_date']}")
    lines.append("")

    # Risk Classification
    lines.append("RISK CLASSIFICATION")
    lines.append("-" * 70)
    risk = report["risk_classification"]
    lines.append(f"Level: {risk['level']}")
    lines.append(
        f"Legal Basis: {risk['legal_basis']['article']} - {risk['legal_basis']['description']}"
    )
    lines.append("")

    lines.append("Compliance Requirements:")
    for req in risk["compliance_requirements"]:
        lines.append(f"  {req}")
    lines.append("")

    # Readiness Assessment
    lines.append("READINESS ASSESSMENT")
    lines.append("-" * 70)
    readiness = report["readiness_assessment"]
    lines.append(f"Overall Score: {readiness['scores']['overall']}/100")
    percentile = readiness["percentile"]
    lines.append(f"Ranking: {percentile['ranking']} ({percentile['assessment']})")
    lines.append("")

    lines.append("Scores by Dimension:")
    for dim, score in readiness["scores"].items():
        if dim != "overall":
            lines.append(f"  {dim.replace('_', ' ').title()}: {score}/100")
    lines.append("")

    # Gaps
    if readiness["gaps"]:
        lines.append(f"Identified Gaps: {len(readiness['gaps'])}")
        lines.append(f"  Critical: {readiness['gap_count']['critical']}")
        lines.append(f"  High: {readiness['gap_count']['high']}")
        lines.append(f"  Medium: {readiness['gap_count']['medium']}")
        lines.append("")

    # Timeline & Cost
    lines.append("TIMELINE & COST ESTIMATES")
    lines.append("-" * 70)
    timeline = report["timeline_cost"]["estimated_timeline"]
    cost = report["timeline_cost"]["estimated_cost"]
    lines.append(f"Timeline: {timeline['description']}")
    lines.append(f"Cost: {cost['description']}")
    lines.append("")

    # Next Steps
    if "recommendations" in report:
        lines.append("RECOMMENDED NEXT STEPS")
        lines.append("-" * 70)
        for i, step in enumerate(report["recommendations"]["next_steps"][:5], 1):
            lines.append(f"{i}. {step}")
        lines.append("")

    # CTA
    lines.append("=" * 70)
    cta = report["next_actions"]
    lines.append(cta["message"])
    lines.append(f"Contact: {cta['contact_url']}")
    lines.append("=" * 70)

    return "\n".join(lines)


def save_report(report: Dict[str, Any], filepath: str, format: str = "json") -> None:
    """
    Save report to file.

    Args:
        report: Report dictionary
        filepath: Path to save file
        format: Format ('json' or 'txt')
    """
    if format == "json":
        with open(filepath, "w") as f:
            json.dump(report, f, indent=2)
    elif format == "txt":
        with open(filepath, "w") as f:
            f.write(format_report_text(report))
    else:
        raise ValueError(f"Unsupported format: {format}")
