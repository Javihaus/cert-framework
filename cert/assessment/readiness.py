"""
Readiness Assessment Module
============================

This module assesses organizational readiness for AI compliance
across multiple dimensions.
"""

from typing import Dict, List, Any


# Scoring weights for different answer types
ANSWER_SCORES = {
    "Yes": 100,
    "Yes, Always": 100,
    "No": 0,
    "Not Sure": 50,
    "In Development": 33,
    "In Progress": 33,
    "Partially": 50,
    "Sometimes": 50,
    "Limited": 33,
    "External Consultants": 75,
    "Partial Automation": 50,
    "Not Applicable": 100,  # N/A counts as full compliance
}


def assess_readiness(answers: Dict[str, str]) -> Dict[str, float]:
    """
    Calculate readiness scores per dimension.

    Args:
        answers: Dictionary of question_id -> answer

    Returns:
        Dictionary of dimension -> score (0-100)
    """
    from cert.assessment.questionnaire import READINESS_QUESTIONS

    scores = {}

    for dimension, questions in READINESS_QUESTIONS.items():
        dimension_score = calculate_dimension_score(dimension, questions, answers)
        scores[dimension] = dimension_score

    # Calculate overall score as average of all dimensions
    if scores:
        scores["overall"] = sum(scores.values()) / len(scores)
    else:
        scores["overall"] = 0.0

    return scores


def calculate_dimension_score(
    dimension: str,
    questions: List[Any],
    answers: Dict[str, str]
) -> float:
    """
    Calculate score for a single dimension.

    Args:
        dimension: Dimension name
        questions: List of questions for this dimension
        answers: User's answers

    Returns:
        Score from 0-100
    """
    if not questions:
        return 0.0

    total_score = 0
    answered_questions = 0

    for question in questions:
        if question.id in answers:
            answer = answers[question.id]
            score = ANSWER_SCORES.get(answer, 0)
            total_score += score
            answered_questions += 1

    if answered_questions == 0:
        return 0.0

    return total_score / answered_questions


def identify_gaps(readiness_scores: Dict[str, float], threshold: float = 60.0) -> List[Dict[str, Any]]:
    """
    Identify areas scoring below threshold.

    Args:
        readiness_scores: Dictionary of dimension -> score
        threshold: Minimum acceptable score (default: 60)

    Returns:
        List of gaps with details
    """
    gaps = []

    for dimension, score in readiness_scores.items():
        if dimension != "overall" and score < threshold:
            severity = "critical" if score < 40 else "high" if score < 60 else "medium"

            gap = {
                "dimension": dimension,
                "score": round(score, 1),
                "gap": round(threshold - score, 1),
                "severity": severity,
                "priority": get_priority_level(dimension, score),
                "recommended_actions": get_remediation_actions(dimension),
            }

            gaps.append(gap)

    # Sort by priority (critical first, then by gap size)
    gaps.sort(key=lambda x: (
        0 if x["severity"] == "critical" else 1,
        -x["gap"]
    ))

    return gaps


def get_priority_level(dimension: str, score: float) -> str:
    """
    Determine priority level for addressing a gap.

    Args:
        dimension: Dimension name
        score: Current score

    Returns:
        Priority level (P0, P1, P2, P3)
    """
    # Critical dimensions always get higher priority
    critical_dimensions = ["data_governance", "documentation"]

    if score < 40:
        return "P0"  # Critical
    elif score < 60:
        if dimension in critical_dimensions:
            return "P0"
        return "P1"  # High
    elif score < 75:
        return "P2"  # Medium
    else:
        return "P3"  # Low


def get_remediation_actions(dimension: str) -> List[str]:
    """
    Get recommended actions to improve a dimension.

    Args:
        dimension: Dimension name

    Returns:
        List of actionable recommendations
    """
    actions = {
        "data_governance": [
            "📝 Document data collection and processing procedures",
            "🔐 Implement secure data storage with access controls",
            "📊 Establish data quality metrics and monitoring",
            "⚖️ Conduct bias assessment on training datasets",
            "🔍 Implement data lineage tracking system",
            "📋 Create data governance policy document",
        ],
        "infrastructure": [
            "📈 Deploy monitoring tools (Prometheus, Grafana, etc.)",
            "🗂️ Implement prediction logging and storage",
            "🔄 Establish rollback procedures and version control",
            "🚀 Set up CI/CD pipelines for model deployment",
            "☁️ Implement infrastructure as code (Terraform, CloudFormation)",
            "🔔 Configure alerting for model performance degradation",
        ],
        "team_skills": [
            "👥 Hire or train ML engineers",
            "📚 Provide AI governance training to team",
            "⚖️ Engage legal/compliance resources",
            "🔐 Train team on security best practices",
            "🎓 Invest in ongoing education and certifications",
            "🤝 Build partnerships with domain experts",
        ],
        "documentation": [
            "📄 Create model cards documenting model details",
            "⚖️ Document risk assessments and mitigation strategies",
            "✅ Write testing procedures and validation criteria",
            "🚨 Develop incident response plan",
            "📋 Maintain compliance documentation repository",
            "🔄 Establish documentation review and update process",
        ],
        "testing_validation": [
            "🤖 Implement automated testing framework",
            "📊 Define performance benchmarks and SLAs",
            "⚖️ Conduct fairness and bias testing",
            "🛡️ Perform adversarial robustness testing",
            "📈 Set up continuous validation in production",
            "🔬 Establish A/B testing framework for model updates",
        ],
    }

    return actions.get(dimension, [
        "📋 Review and improve processes in this area",
        "📚 Consult best practices and industry standards",
        "🎯 Set specific, measurable improvement goals",
    ])


def generate_improvement_roadmap(gaps: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generate a phased improvement roadmap based on gaps.

    Args:
        gaps: List of identified gaps

    Returns:
        Roadmap with phases and timelines
    """
    roadmap = {
        "phase_1_immediate": {
            "title": "Immediate Actions (Weeks 1-4)",
            "priority": "P0",
            "items": [],
        },
        "phase_2_short_term": {
            "title": "Short-term Improvements (Months 2-3)",
            "priority": "P1",
            "items": [],
        },
        "phase_3_medium_term": {
            "title": "Medium-term Enhancements (Months 4-6)",
            "priority": "P2",
            "items": [],
        },
        "phase_4_long_term": {
            "title": "Long-term Optimization (Months 6-12)",
            "priority": "P3",
            "items": [],
        },
    }

    for gap in gaps:
        priority = gap["priority"]
        item = {
            "dimension": gap["dimension"],
            "score": gap["score"],
            "actions": gap["recommended_actions"][:3],  # Top 3 actions
        }

        if priority == "P0":
            roadmap["phase_1_immediate"]["items"].append(item)
        elif priority == "P1":
            roadmap["phase_2_short_term"]["items"].append(item)
        elif priority == "P2":
            roadmap["phase_3_medium_term"]["items"].append(item)
        else:
            roadmap["phase_4_long_term"]["items"].append(item)

    return roadmap


def calculate_readiness_percentile(overall_score: float) -> Dict[str, Any]:
    """
    Calculate percentile ranking compared to industry benchmarks.

    Args:
        overall_score: Overall readiness score (0-100)

    Returns:
        Percentile information
    """
    # These are hypothetical industry benchmarks
    # In production, these would be based on actual data
    percentile_mapping = [
        (90, 95, "Top 5%", "Excellent"),
        (80, 85, "Top 15%", "Very Good"),
        (70, 70, "Top 30%", "Good"),
        (60, 55, "Above Average", "Fair"),
        (50, 40, "Average", "Needs Improvement"),
        (0, 15, "Below Average", "Significant Gaps"),
    ]

    for min_score, percentile, ranking, assessment in percentile_mapping:
        if overall_score >= min_score:
            return {
                "score": overall_score,
                "percentile": percentile,
                "ranking": ranking,
                "assessment": assessment,
            }

    return {
        "score": overall_score,
        "percentile": 15,
        "ranking": "Below Average",
        "assessment": "Significant Gaps",
    }
