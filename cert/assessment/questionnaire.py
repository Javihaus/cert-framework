"""
AI Readiness Questionnaire
===========================

This module implements the questionnaire for AI risk assessment and
readiness evaluation based on the EU AI Act Annex III.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional


@dataclass
class Question:
    """
    A single question in the assessment.

    Attributes:
        id: Unique identifier for the question
        text: The question text
        options: List of possible answers
        risk_factors: Mapping of answers to risk scores
        category: Question category for grouping
    """

    id: str
    text: str
    options: List[str]
    risk_factors: Dict[str, int]
    category: str = "general"


# EU AI Act Annex III criteria as executable code
ANNEX_III_QUESTIONS = [
    Question(
        id="biometric_identification",
        text="Does the AI system use biometric identification or categorization of natural persons?",
        options=["Yes", "No", "Not Sure"],
        risk_factors={"Yes": 100, "No": 0, "Not Sure": 50},
        category="prohibited_use",
    ),
    Question(
        id="critical_infrastructure",
        text="Will the AI system be used as a safety component in the management and operation of critical infrastructure (energy, transport, water, health)?",
        options=["Yes", "No", "Not Sure"],
        risk_factors={"Yes": 80, "No": 0, "Not Sure": 40},
        category="high_risk",
    ),
    Question(
        id="education_training",
        text="Will the AI system be used to determine access to educational institutions or for evaluating learning outcomes?",
        options=["Yes", "No", "Not Sure"],
        risk_factors={"Yes": 80, "No": 0, "Not Sure": 40},
        category="high_risk",
    ),
    Question(
        id="employment",
        text="Will the AI system be used for recruitment, selection of persons, or evaluation of workers (including promotion and termination decisions)?",
        options=["Yes", "No", "Not Sure"],
        risk_factors={"Yes": 80, "No": 0, "Not Sure": 40},
        category="high_risk",
    ),
    Question(
        id="essential_services",
        text="Will the AI system be used to evaluate creditworthiness, establish credit scores, or determine access to essential private/public services (insurance, healthcare benefits)?",
        options=["Yes", "No", "Not Sure"],
        risk_factors={"Yes": 80, "No": 0, "Not Sure": 40},
        category="high_risk",
    ),
    Question(
        id="law_enforcement",
        text="Will the AI system be used by law enforcement authorities (risk assessment, polygraph, emotion recognition, crime analytics)?",
        options=["Yes", "No", "Not Sure"],
        risk_factors={"Yes": 100, "No": 0, "Not Sure": 50},
        category="prohibited_use",
    ),
    Question(
        id="migration_asylum",
        text="Will the AI system be used for migration, asylum, and border control management (including verification of documents, risk assessments)?",
        options=["Yes", "No", "Not Sure"],
        risk_factors={"Yes": 80, "No": 0, "Not Sure": 40},
        category="high_risk",
    ),
    Question(
        id="justice_democracy",
        text="Will the AI system be used to assist judicial authorities in researching and interpreting facts and the law?",
        options=["Yes", "No", "Not Sure"],
        risk_factors={"Yes": 80, "No": 0, "Not Sure": 40},
        category="high_risk",
    ),
    Question(
        id="high_volume_decisions",
        text="Will the AI system make more than 10,000 decisions affecting individuals per year?",
        options=["Yes", "No", "Not Sure"],
        risk_factors={"Yes": 40, "No": 0, "Not Sure": 20},
        category="scale",
    ),
    Question(
        id="automated_decision_making",
        text="Does the AI system make fully automated decisions without human oversight?",
        options=["Yes", "No", "Partial Automation"],
        risk_factors={"Yes": 60, "No": 0, "Partial Automation": 30},
        category="automation_level",
    ),
    Question(
        id="vulnerable_groups",
        text="Does the AI system interact with or make decisions about vulnerable groups (children, elderly, people with disabilities)?",
        options=["Yes", "No", "Not Sure"],
        risk_factors={"Yes": 60, "No": 0, "Not Sure": 30},
        category="impact",
    ),
    Question(
        id="social_scoring",
        text="Does the AI system evaluate or classify individuals based on social behavior or personal characteristics?",
        options=["Yes", "No", "Not Sure"],
        risk_factors={"Yes": 100, "No": 0, "Not Sure": 50},
        category="prohibited_use",
    ),
    Question(
        id="manipulation",
        text="Does the AI system deploy subliminal techniques or exploit vulnerabilities to materially distort behavior?",
        options=["Yes", "No", "Not Sure"],
        risk_factors={"Yes": 100, "No": 0, "Not Sure": 50},
        category="prohibited_use",
    ),
    Question(
        id="transparency_to_users",
        text="Are users informed that they are interacting with an AI system?",
        options=["Yes, Always", "Sometimes", "No", "Not Applicable"],
        risk_factors={"Yes, Always": 0, "Sometimes": 30, "No": 60, "Not Applicable": 0},
        category="transparency",
    ),
]


# Readiness assessment questions across different dimensions
READINESS_QUESTIONS = {
    "data_governance": [
        Question(
            id="data_collection_procedures",
            text="Do you have documented data collection procedures?",
            options=["Yes", "No", "In Development"],
            risk_factors={},
            category="data_governance",
        ),
        Question(
            id="data_versioning",
            text="Is training data versioned and stored securely?",
            options=["Yes", "No", "Partially"],
            risk_factors={},
            category="data_governance",
        ),
        Question(
            id="data_quality_metrics",
            text="Have you assessed data quality metrics (completeness, accuracy, representativeness)?",
            options=["Yes", "No", "In Progress"],
            risk_factors={},
            category="data_governance",
        ),
        Question(
            id="bias_testing",
            text="Do you have bias testing procedures for your datasets?",
            options=["Yes", "No", "In Development"],
            risk_factors={},
            category="data_governance",
        ),
        Question(
            id="data_lineage",
            text="Is data lineage tracked from source to model?",
            options=["Yes", "No", "Partially"],
            risk_factors={},
            category="data_governance",
        ),
    ],
    "infrastructure": [
        Question(
            id="production_monitoring",
            text="Do you have monitoring in production?",
            options=["Yes", "No", "In Development"],
            risk_factors={},
            category="infrastructure",
        ),
        Question(
            id="prediction_logging",
            text="Are model predictions logged?",
            options=["Yes", "No", "Partially"],
            risk_factors={},
            category="infrastructure",
        ),
        Question(
            id="rollback_procedures",
            text="Do you have rollback procedures for model deployments?",
            options=["Yes", "No", "In Development"],
            risk_factors={},
            category="infrastructure",
        ),
        Question(
            id="version_control",
            text="Is infrastructure version controlled?",
            options=["Yes", "No", "Partially"],
            risk_factors={},
            category="infrastructure",
        ),
        Question(
            id="cicd_pipelines",
            text="Do you have CI/CD pipelines for model deployment?",
            options=["Yes", "No", "In Development"],
            risk_factors={},
            category="infrastructure",
        ),
    ],
    "team_skills": [
        Question(
            id="ml_engineering",
            text="Do you have ML engineering expertise on your team?",
            options=["Yes", "No", "Limited"],
            risk_factors={},
            category="team_skills",
        ),
        Question(
            id="domain_expertise",
            text="Do you have domain expertise for your use case?",
            options=["Yes", "No", "Limited"],
            risk_factors={},
            category="team_skills",
        ),
        Question(
            id="governance_training",
            text="Has your team received AI governance training?",
            options=["Yes", "No", "In Progress"],
            risk_factors={},
            category="team_skills",
        ),
        Question(
            id="legal_compliance_resources",
            text="Do you have legal/compliance resources?",
            options=["Yes", "No", "External Consultants"],
            risk_factors={},
            category="team_skills",
        ),
        Question(
            id="security_expertise",
            text="Do you have security expertise on your team?",
            options=["Yes", "No", "Limited"],
            risk_factors={},
            category="team_skills",
        ),
    ],
    "documentation": [
        Question(
            id="model_documentation",
            text="Do you have comprehensive model documentation?",
            options=["Yes", "No", "In Progress"],
            risk_factors={},
            category="documentation",
        ),
        Question(
            id="risk_assessment_docs",
            text="Have you documented risk assessments?",
            options=["Yes", "No", "In Progress"],
            risk_factors={},
            category="documentation",
        ),
        Question(
            id="testing_procedures",
            text="Are testing procedures documented?",
            options=["Yes", "No", "Partially"],
            risk_factors={},
            category="documentation",
        ),
        Question(
            id="incident_response_plan",
            text="Do you have an incident response plan?",
            options=["Yes", "No", "In Development"],
            risk_factors={},
            category="documentation",
        ),
        Question(
            id="compliance_documentation",
            text="Is compliance documentation maintained and up-to-date?",
            options=["Yes", "No", "Partially"],
            risk_factors={},
            category="documentation",
        ),
    ],
    "testing_validation": [
        Question(
            id="automated_testing",
            text="Do you have automated testing for your models?",
            options=["Yes", "No", "In Development"],
            risk_factors={},
            category="testing_validation",
        ),
        Question(
            id="performance_benchmarks",
            text="Have you established performance benchmarks?",
            options=["Yes", "No", "In Progress"],
            risk_factors={},
            category="testing_validation",
        ),
        Question(
            id="fairness_testing",
            text="Do you perform fairness/bias testing?",
            options=["Yes", "No", "In Development"],
            risk_factors={},
            category="testing_validation",
        ),
        Question(
            id="adversarial_testing",
            text="Do you perform adversarial/robustness testing?",
            options=["Yes", "No", "In Development"],
            risk_factors={},
            category="testing_validation",
        ),
        Question(
            id="ongoing_validation",
            text="Is there ongoing validation of model performance in production?",
            options=["Yes", "No", "In Development"],
            risk_factors={},
            category="testing_validation",
        ),
    ],
}


def run_interactive_questionnaire(
    questions: List[Question], title: str = "CERT AI Assessment"
) -> Dict[str, str]:
    """
    Run an interactive questionnaire in the terminal.

    Args:
        questions: List of Question objects to ask
        title: Title to display at the start

    Returns:
        Dictionary mapping question IDs to selected answers
    """
    import sys

    answers = {}

    print(f"\n{'=' * 60}")
    print(f"{title:^60}")
    print(f"{'=' * 60}\n")

    for i, question in enumerate(questions, 1):
        print(f"\nQuestion {i}/{len(questions)}")
        print(f"{question.text}\n")

        for j, option in enumerate(question.options, 1):
            print(f"  {j}. {option}")

        while True:
            try:
                choice_str = input(f"\nYour answer (1-{len(question.options)}): ").strip()
                choice = int(choice_str)

                if 1 <= choice <= len(question.options):
                    answers[question.id] = question.options[choice - 1]
                    break
                else:
                    print(f"Please enter a number between 1 and {len(question.options)}")
            except ValueError:
                print("Please enter a valid number")
            except (KeyboardInterrupt, EOFError):
                print("\n\nAssessment cancelled.")
                sys.exit(1)

    print(f"\n{'=' * 60}")
    print("Assessment complete!")
    print(f"{'=' * 60}\n")

    return answers


def calculate_risk_score(answers: Dict[str, str]) -> int:
    """
    Calculate total risk score from answers.

    Args:
        answers: Dictionary of question_id -> answer

    Returns:
        Total risk score
    """
    total_score = 0

    for question in ANNEX_III_QUESTIONS:
        if question.id in answers:
            answer = answers[question.id]
            score = question.risk_factors.get(answer, 0)
            total_score += score

    return total_score


def get_question_by_id(question_id: str) -> Optional[Question]:
    """
    Find a question by its ID.

    Args:
        question_id: The question ID to search for

    Returns:
        Question object or None if not found
    """
    # Search in Annex III questions
    for question in ANNEX_III_QUESTIONS:
        if question.id == question_id:
            return question

    # Search in readiness questions
    for category_questions in READINESS_QUESTIONS.values():
        for question in category_questions:
            if question.id == question_id:
                return question

    return None
