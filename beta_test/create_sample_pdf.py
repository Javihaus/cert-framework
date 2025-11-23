"""Create sample PDF documents for testing the agentic pipeline."""
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch

def create_financial_report():
    """Create a sample financial report PDF."""
    filename = "sample_financial_report.pdf"
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter

    # Title
    c.setFont("Helvetica-Bold", 18)
    c.drawString(1*inch, height - 1*inch, "TechCorp Inc. - Q3 2024 Financial Report")

    # Summary section
    c.setFont("Helvetica-Bold", 14)
    c.drawString(1*inch, height - 1.8*inch, "Executive Summary")

    c.setFont("Helvetica", 11)
    text_lines = [
        "TechCorp Inc. reported strong financial performance in Q3 2024.",
        "Total revenue reached $125.5 million, a 23% increase year-over-year.",
        "Net income was $18.2 million, representing a profit margin of 14.5%.",
        "Operating expenses totaled $89.3 million, up 15% from Q3 2023.",
        "",
        "Key Highlights:",
        "- Cloud services revenue: $78.2 million (+35% YoY)",
        "- Enterprise software sales: $32.1 million (+12% YoY)",
        "- Professional services: $15.2 million (+8% YoY)",
        "",
        "Customer metrics showed continued growth:",
        "- Total active customers: 4,532 (+18% from Q2 2024)",
        "- Enterprise customers: 342 (+25% from Q2 2024)",
        "- Customer retention rate: 94.2%",
        "- Net Promoter Score (NPS): 72",
        "",
        "Regional Performance:",
        "- North America: $82.5 million (66% of total revenue)",
        "- Europe: $28.4 million (23% of total revenue)",
        "- Asia Pacific: $14.6 million (11% of total revenue)",
        "",
        "Outlook:",
        "Management expects Q4 2024 revenue between $130-135 million.",
        "Full year 2024 revenue guidance raised to $475-485 million.",
        "Continued investment in AI and cloud infrastructure planned for 2025.",
    ]

    y_position = height - 2.3*inch
    for line in text_lines:
        c.drawString(1*inch, y_position, line)
        y_position -= 0.25*inch

    # Page 2 - Detailed financials
    c.showPage()
    c.setFont("Helvetica-Bold", 14)
    c.drawString(1*inch, height - 1*inch, "Detailed Financial Statements")

    c.setFont("Helvetica", 11)
    financial_details = [
        "",
        "INCOME STATEMENT (in millions USD)",
        "=" * 50,
        "Revenue:",
        "  Cloud Services Revenue:          $78.2",
        "  Software License Revenue:        $32.1",
        "  Professional Services:           $15.2",
        "  Total Revenue:                   $125.5",
        "",
        "Cost of Revenue:",
        "  Cost of Cloud Services:          $23.4",
        "  Cost of Software:                $8.5",
        "  Cost of Services:                $9.2",
        "  Total Cost of Revenue:           $41.1",
        "",
        "Gross Profit:                      $84.4",
        "Gross Margin:                      67.3%",
        "",
        "Operating Expenses:",
        "  Research & Development:          $31.2",
        "  Sales & Marketing:               $28.5",
        "  General & Administrative:        $6.5",
        "  Total Operating Expenses:        $66.2",
        "",
        "Operating Income:                  $18.2",
        "Operating Margin:                  14.5%",
        "",
        "Risk Factors:",
        "- Market competition from major cloud providers",
        "- Currency exchange rate fluctuations",
        "- Regulatory changes in data privacy laws",
        "- Dependency on key enterprise customers",
    ]

    y_position = height - 1.5*inch
    for line in financial_details:
        c.drawString(1*inch, y_position, line)
        y_position -= 0.22*inch

    c.save()
    print(f"Created: {filename}")
    return filename


def create_research_paper():
    """Create a sample research paper PDF."""
    filename = "sample_research_paper.pdf"
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter

    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(1*inch, height - 1*inch, "Impact of AI on Software Development Productivity")

    c.setFont("Helvetica-Oblique", 11)
    c.drawString(1*inch, height - 1.4*inch, "A Comprehensive Study of 500 Development Teams")

    c.setFont("Helvetica", 10)
    c.drawString(1*inch, height - 1.7*inch, "Authors: Dr. Sarah Chen, Prof. Michael Rodriguez, Dr. Emily Watson")
    c.drawString(1*inch, height - 1.95*inch, "Published: September 2024 | Journal of Software Engineering Research")

    c.setFont("Helvetica-Bold", 12)
    c.drawString(1*inch, height - 2.5*inch, "Abstract")

    c.setFont("Helvetica", 10)
    abstract_lines = [
        "This study examines the impact of AI-assisted coding tools on software",
        "development productivity across 500 development teams over 18 months.",
        "Results show a 37% average increase in code output, with significant",
        "variations based on team size, programming language, and project type.",
        "Quality metrics improved by 22%, while time-to-deployment decreased by 31%.",
    ]

    y_position = height - 2.9*inch
    for line in abstract_lines:
        c.drawString(1*inch, y_position, line)
        y_position -= 0.22*inch

    # Key findings
    c.setFont("Helvetica-Bold", 12)
    c.drawString(1*inch, y_position - 0.3*inch, "Key Findings")

    findings = [
        "",
        "1. Productivity Metrics:",
        "   - Lines of code per developer per day: +37% (from 145 to 199)",
        "   - Pull requests merged per week: +28% (from 12.3 to 15.7)",
        "   - Bug fix resolution time: -24% (from 4.2 to 3.2 hours)",
        "",
        "2. Code Quality Indicators:",
        "   - Code review pass rate: +22% (from 78% to 95%)",
        "   - Post-deployment bugs: -41% (from 8.3 to 4.9 per 1000 lines)",
        "   - Test coverage: +18% (from 72% to 85%)",
        "",
        "3. Team Dynamics:",
        "   - Developer satisfaction score: 8.2/10 (up from 7.1/10)",
        "   - Onboarding time for new developers: -35%",
        "   - Cross-team collaboration increased by 45%",
        "",
        "4. Economic Impact:",
        "   - Estimated cost savings: $45,000 per developer per year",
        "   - ROI on AI tools: 312% over 12-month period",
        "   - Time saved per developer: 8.5 hours per week",
        "",
        "Methodology: Mixed-methods approach combining quantitative analysis",
        "of development metrics with qualitative interviews. Data collected",
        "from January 2023 to June 2024 across 47 companies in 12 countries.",
    ]

    y_position = y_position - 0.3*inch
    for line in findings:
        c.drawString(1*inch, y_position, line)
        y_position -= 0.22*inch

    c.save()
    print(f"Created: {filename}")
    return filename


if __name__ == "__main__":
    create_financial_report()
    create_research_paper()
    print("\nSample PDFs created successfully!")
