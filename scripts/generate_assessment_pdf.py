#!/usr/bin/env python3
"""
Generate EU AI Act Assessment Report PDF

Converts assessment JSON data into a professional PDF report.

Usage:
    python generate_assessment_pdf.py assessment.json --output report.pdf
    python generate_assessment_pdf.py assessment.json --output report.pdf --email user@example.com
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import (
        SimpleDocTemplate,
        Paragraph,
        Spacer,
        PageBreak,
        Table,
        TableStyle,
        KeepTogether,
    )
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
except ImportError:
    print("Error: reportlab not installed")
    print("Install with: pip install reportlab")
    sys.exit(1)


def load_assessment_data(filepath):
    """Load assessment JSON data."""
    try:
        with open(filepath, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: File not found: {filepath}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON: {e}")
        sys.exit(1)


def get_risk_color(risk_level):
    """Get color for risk level."""
    risk_colors = {
        "PROHIBITED": colors.red,
        "HIGH_RISK": colors.orange,
        "LIMITED_RISK": colors.blue,
        "MINIMAL_RISK": colors.green,
    }
    return risk_colors.get(risk_level, colors.gray)


def generate_assessment_pdf(assessment_data, output_path, email=None):
    """
    Generate professional assessment report PDF.

    Args:
        assessment_data: Dict with assessment results
        output_path: Path to save PDF
        email: Optional email address for the report recipient
    """
    print(f"Generating assessment PDF: {output_path}")

    # Create PDF document
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    # Container for PDF elements
    elements = []

    # Define styles
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Heading1"],
        fontSize=24,
        textColor=colors.HexColor("#1a365d"),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName="Helvetica-Bold",
    )

    heading_style = ParagraphStyle(
        "CustomHeading",
        parent=styles["Heading2"],
        fontSize=16,
        textColor=colors.HexColor("#2c5282"),
        spaceAfter=12,
        spaceBefore=12,
        fontName="Helvetica-Bold",
    )

    normal_style = ParagraphStyle(
        "CustomNormal",
        parent=styles["Normal"],
        fontSize=11,
        leading=16,
    )

    # Extract data
    risk_level = assessment_data.get("riskLevel", "UNKNOWN")
    risk_score = assessment_data.get("riskScore", 0)
    readiness_score = assessment_data.get("readinessScore", 0)
    requirements = assessment_data.get("requirements", [])
    estimated_cost = assessment_data.get("estimatedCost", "Not available")
    estimated_timeline = assessment_data.get("estimatedTimeline", "Not available")
    next_steps = assessment_data.get("nextSteps", [])
    strengths = assessment_data.get("strengths", [])
    gaps = assessment_data.get("gaps", [])

    # Title Page
    elements.append(Spacer(1, 1 * inch))
    elements.append(Paragraph("EU AI Act Compliance", title_style))
    elements.append(Paragraph("Assessment Report", title_style))
    elements.append(Spacer(1, 0.5 * inch))

    # Risk Level Badge (centered)
    risk_color = get_risk_color(risk_level)
    risk_label = risk_level.replace("_", " ").title()

    risk_data = [[Paragraph(f"<b>{risk_label}</b>", normal_style)]]
    risk_table = Table(risk_data, colWidths=[4 * inch])
    risk_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), risk_color),
            ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 18),
            ("TOPPADDING", (0, 0), (-1, -1), 20),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 20),
            ("ROUNDEDCORNERS", [10, 10, 10, 10]),
        ])
    )
    elements.append(risk_table)
    elements.append(Spacer(1, 0.5 * inch))

    # Generation info
    gen_info = f"Generated: {datetime.now().strftime('%B %d, %Y')}"
    if email:
        gen_info += f" | {email}"
    elements.append(Paragraph(gen_info, ParagraphStyle("center", alignment=TA_CENTER, fontSize=10, textColor=colors.gray)))

    elements.append(PageBreak())

    # Executive Summary
    elements.append(Paragraph("Executive Summary", heading_style))
    elements.append(Spacer(1, 0.2 * inch))

    # Scores table
    scores_data = [
        ["Metric", "Score"],
        ["Risk Score", str(risk_score)],
        ["Readiness Score", f"{readiness_score:.0f}%"],
        ["Risk Classification", risk_label],
    ]

    scores_table = Table(scores_data, colWidths=[3 * inch, 3 * inch])
    scores_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c5282")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 12),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
            ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f7fafc")),
            ("GRID", (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
            ("FONTSIZE", (0, 1), (-1, -1), 11),
            ("TOPPADDING", (0, 1), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 1), (-1, -1), 8),
        ])
    )

    elements.append(scores_table)
    elements.append(Spacer(1, 0.3 * inch))

    # Compliance Requirements
    elements.append(Paragraph("Compliance Requirements", heading_style))
    elements.append(Spacer(1, 0.1 * inch))

    for req in requirements:
        elements.append(Paragraph(f"• {req}", normal_style))

    elements.append(Spacer(1, 0.3 * inch))

    # Resource Estimates
    elements.append(Paragraph("Resource Estimates", heading_style))
    elements.append(Spacer(1, 0.1 * inch))

    estimates_data = [
        ["Estimated Cost", estimated_cost],
        ["Estimated Timeline", estimated_timeline],
    ]

    estimates_table = Table(estimates_data, colWidths=[2.5 * inch, 3.5 * inch])
    estimates_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f7fafc")),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 11),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("GRID", (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
        ])
    )

    elements.append(estimates_table)
    elements.append(PageBreak())

    # Current State Assessment
    elements.append(Paragraph("Current State Assessment", heading_style))
    elements.append(Spacer(1, 0.2 * inch))

    # Strengths
    if strengths:
        elements.append(Paragraph("<b>Strengths:</b>", normal_style))
        elements.append(Spacer(1, 0.1 * inch))
        for strength in strengths:
            elements.append(Paragraph(f"✓ {strength}", normal_style))
        elements.append(Spacer(1, 0.2 * inch))

    # Gaps
    if gaps:
        elements.append(Paragraph("<b>Areas for Development:</b>", normal_style))
        elements.append(Spacer(1, 0.1 * inch))
        for gap in gaps:
            elements.append(Paragraph(f"⚠ {gap}", normal_style))
        elements.append(Spacer(1, 0.3 * inch))

    # Recommended Next Steps
    elements.append(Paragraph("Recommended Next Steps", heading_style))
    elements.append(Spacer(1, 0.1 * inch))

    for i, step in enumerate(next_steps, 1):
        elements.append(Paragraph(f"{i}. {step}", normal_style))

    elements.append(Spacer(1, 0.5 * inch))

    # Footer
    elements.append(Paragraph(
        "<i>This assessment is based on your responses to the CERT AI Readiness Assessment questionnaire. "
        "For detailed implementation guidance and support, contact the CERT team.</i>",
        ParagraphStyle("footer", fontSize=9, textColor=colors.gray, alignment=TA_LEFT)
    ))

    # Build PDF
    doc.build(elements)
    print(f"✓ Assessment PDF generated: {output_path}")


def main():
    """Main execution function."""
    parser = argparse.ArgumentParser(description="Generate EU AI Act Assessment Report PDF")
    parser.add_argument("assessment_json", help="Path to assessment JSON file")
    parser.add_argument("--output", "-o", required=True, help="Output PDF path")
    parser.add_argument("--email", help="Recipient email address (optional)")

    args = parser.parse_args()

    # Load assessment data
    assessment_data = load_assessment_data(args.assessment_json)

    # Generate PDF
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    generate_assessment_pdf(assessment_data, output_path, args.email)

    print("\n✓ Assessment report generated successfully")
    print(f"  Location: {output_path}")
    if args.email:
        print(f"  Recipient: {args.email}")


if __name__ == "__main__":
    main()
