"""
Risk Classification Engine
==========================

This module classifies AI systems according to EU AI Act risk levels
and provides compliance requirements for each level.
"""

from typing import Dict, List


def classify_risk(risk_score: int) -> str:
    """
    Map risk score to EU AI Act risk levels.

    Risk Levels:
    - PROHIBITED: Unacceptable risk per Article 5 (score >= 100)
    - HIGH_RISK: Annex III high-risk systems (score >= 80)
    - LIMITED_RISK: Transparency obligations (score >= 40)
    - MINIMAL_RISK: No specific obligations (score < 40)

    Args:
        risk_score: Calculated risk score from questionnaire

    Returns:
        Risk level string
    """
    if risk_score >= 100:
        return "PROHIBITED"
    elif risk_score >= 80:
        return "HIGH_RISK"
    elif risk_score >= 40:
        return "LIMITED_RISK"
    else:
        return "MINIMAL_RISK"


def get_legal_basis(risk_level: str) -> Dict[str, str]:
    """
    Get the legal basis for a risk classification.

    Args:
        risk_level: Risk level (PROHIBITED, HIGH_RISK, etc.)

    Returns:
        Dictionary with legal references
    """
    legal_basis = {
        "PROHIBITED": {
            "article": "Article 5",
            "description": "Prohibited AI practices",
            "reference": "EU AI Act Article 5 - Prohibited artificial intelligence practices",
            "summary": "AI systems that pose unacceptable risks to fundamental rights are prohibited.",
        },
        "HIGH_RISK": {
            "article": "Annex III",
            "description": "High-risk AI systems",
            "reference": "EU AI Act Annex III - High-risk AI systems",
            "summary": "AI systems that pose significant risks to health, safety, or fundamental rights require strict compliance.",
        },
        "LIMITED_RISK": {
            "article": "Article 52",
            "description": "Transparency obligations",
            "reference": "EU AI Act Article 52 - Transparency obligations for certain AI systems",
            "summary": "AI systems with transparency obligations must inform users they are interacting with AI.",
        },
        "MINIMAL_RISK": {
            "article": "N/A",
            "description": "No mandatory requirements",
            "reference": "EU AI Act - Voluntary codes of conduct",
            "summary": "AI systems with minimal risk have no mandatory compliance requirements but may follow voluntary codes.",
        },
    }

    return legal_basis.get(risk_level, legal_basis["MINIMAL_RISK"])


def get_compliance_requirements(risk_level: str) -> List[str]:
    """
    Get compliance requirements based on risk level.

    Args:
        risk_level: Risk level classification

    Returns:
        List of compliance requirements
    """
    requirements = {
        "PROHIBITED": [
            "⛔ System cannot be deployed under EU AI Act",
            "⚠️ Consider alternative approaches that don't trigger Article 5",
            "📋 Consult legal counsel before proceeding",
            "🔄 Redesign system to avoid prohibited use cases",
        ],
        "HIGH_RISK": [
            "📋 Conformity assessment required (Annex VI or VII)",
            "📄 Technical documentation per Annex IV",
            "⚖️ Risk management system (Article 9)",
            "📊 Data governance measures (Article 10)",
            "🗂️ Record-keeping system (Article 12)",
            "👁️ Transparency obligations (Article 13)",
            "👤 Human oversight measures (Article 14)",
            "✅ Accuracy/robustness testing (Article 15)",
            "🔐 Cybersecurity measures (Article 15)",
            "📝 Registration in EU database",
            "⚖️ Fundamental rights impact assessment",
            "📋 Post-market monitoring system (Article 72)",
            "🔍 Quality management system (Article 17)",
        ],
        "LIMITED_RISK": [
            "👁️ Transparency obligations (Article 52)",
            "💬 Disclosure that users are interacting with AI",
            "📄 Documentation of system limitations",
            "ℹ️ Provide information on how the AI system works",
        ],
        "MINIMAL_RISK": [
            "📖 Voluntary codes of conduct encouraged",
            "✨ No mandatory requirements",
            "🎯 Best practices recommended",
            "📊 Optional monitoring and documentation",
        ],
    }

    return requirements.get(risk_level, requirements["MINIMAL_RISK"])


def get_prohibited_use_cases() -> List[Dict[str, str]]:
    """
    Get list of prohibited AI use cases under Article 5.

    Returns:
        List of prohibited use cases with descriptions
    """
    return [
        {
            "use_case": "Subliminal manipulation",
            "description": "AI systems that deploy subliminal techniques beyond a person's consciousness to materially distort their behavior in a manner that causes or is likely to cause harm",
            "article": "Article 5(1)(a)",
        },
        {
            "use_case": "Exploitation of vulnerabilities",
            "description": "AI systems that exploit vulnerabilities of specific groups (age, disability) to materially distort their behavior in a harmful way",
            "article": "Article 5(1)(b)",
        },
        {
            "use_case": "Social scoring",
            "description": "AI systems for social scoring by public authorities",
            "article": "Article 5(1)(c)",
        },
        {
            "use_case": "Real-time biometric identification",
            "description": "Real-time remote biometric identification in publicly accessible spaces for law enforcement (with limited exceptions)",
            "article": "Article 5(1)(d)",
        },
        {
            "use_case": "Biometric categorization",
            "description": "AI systems that create or expand facial recognition databases through scraping of facial images",
            "article": "Article 5(1)(e)",
        },
        {
            "use_case": "Emotion recognition in workplace/education",
            "description": "AI systems that infer emotions in workplace and education settings (except medical/safety reasons)",
            "article": "Article 5(1)(f)",
        },
        {
            "use_case": "Predictive policing based on profiling",
            "description": "AI systems for risk assessments of individuals to predict criminal offenses based solely on profiling",
            "article": "Article 5(1)(g)",
        },
    ]


def analyze_prohibited_triggers(answers: Dict[str, str]) -> List[Dict[str, str]]:
    """
    Analyze which prohibited use cases are triggered by the answers.

    Args:
        answers: Dictionary of question_id -> answer

    Returns:
        List of triggered prohibited use cases
    """
    triggered = []

    # Check biometric identification
    if answers.get("biometric_identification") == "Yes":
        triggered.append(
            {
                "trigger": "Biometric identification",
                "article": "Article 5(1)(d)",
                "severity": "CRITICAL",
                "action": "Cannot deploy - prohibited use case",
            }
        )

    # Check law enforcement use
    if answers.get("law_enforcement") == "Yes":
        triggered.append(
            {
                "trigger": "Law enforcement use",
                "article": "Article 5(1)(d)",
                "severity": "CRITICAL",
                "action": "Review specific use case - may be prohibited",
            }
        )

    # Check social scoring
    if answers.get("social_scoring") == "Yes":
        triggered.append(
            {
                "trigger": "Social scoring",
                "article": "Article 5(1)(c)",
                "severity": "CRITICAL",
                "action": "Cannot deploy - prohibited use case",
            }
        )

    # Check manipulation
    if answers.get("manipulation") == "Yes":
        triggered.append(
            {
                "trigger": "Subliminal manipulation",
                "article": "Article 5(1)(a)",
                "severity": "CRITICAL",
                "action": "Cannot deploy - prohibited use case",
            }
        )

    return triggered


def get_next_steps(risk_level: str, readiness_score: float = None) -> List[str]:
    """
    Get recommended next steps based on risk level and readiness.

    Args:
        risk_level: Risk classification
        readiness_score: Overall readiness score (0-100)

    Returns:
        List of recommended next steps
    """
    steps = {
        "PROHIBITED": [
            "1. 🛑 Stop deployment immediately if system is in production",
            "2. 📞 Consult with legal counsel specialized in EU AI Act",
            "3. 🔄 Redesign system to avoid prohibited use cases",
            "4. 📋 Document alternative approaches that comply with Article 5",
            "5. ⚖️ Consider fundamental rights impact assessment for redesign",
        ],
        "HIGH_RISK": [
            "1. 📋 Begin technical documentation process (Annex IV)",
            "2. ⚖️ Establish risk management system (Article 9)",
            "3. 📊 Implement data governance measures (Article 10)",
            "4. 👤 Design human oversight mechanisms (Article 14)",
            "5. ✅ Develop testing and validation procedures (Article 15)",
            "6. 📝 Prepare for conformity assessment (Annex VI/VII)",
            "7. 🗂️ Set up record-keeping systems (Article 12)",
            "8. 📈 Establish post-market monitoring (Article 72)",
        ],
        "LIMITED_RISK": [
            "1. 💬 Implement user disclosure mechanisms (Article 52)",
            "2. 📄 Document system capabilities and limitations",
            "3. ℹ️ Create user-facing explanations of AI functionality",
            "4. 📊 Set up basic monitoring and logging",
            "5. 📋 Review and update documentation regularly",
        ],
        "MINIMAL_RISK": [
            "1. 📖 Review voluntary codes of conduct",
            "2. 🎯 Implement best practices for responsible AI",
            "3. 📊 Consider optional monitoring for quality assurance",
            "4. 📋 Maintain basic documentation for internal purposes",
            "5. 🔄 Stay informed about regulatory updates",
        ],
    }

    next_steps = steps.get(risk_level, steps["MINIMAL_RISK"])

    # Add readiness-specific steps if score is provided
    if readiness_score is not None and risk_level in ["HIGH_RISK", "LIMITED_RISK"]:
        if readiness_score < 40:
            next_steps.insert(1, "⚠️ Address critical readiness gaps before proceeding")
        elif readiness_score < 60:
            next_steps.insert(1, "📈 Improve readiness scores in low-scoring areas")

    return next_steps
