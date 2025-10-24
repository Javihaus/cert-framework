"""CERT Framework Quickstart - Compliance Reports

Generate plain-English compliance reports for EU AI Act Article 15.

Perfect for:
- Showing to compliance teams
- Regulatory audits
- Internal documentation
- Proving "appropriate levels of accuracy"

Time to generate: < 5 seconds
"""

import cert

# ============================================
# STEP 1: Monitor your system
# ============================================

# First, monitor your RAG system for a period of time
# (This would run in production for days/weeks)


@cert.monitor
def my_rag(query):
    """Your RAG system being monitored."""
    # Simulate RAG
    return {
        "context": "Apple Q4 2024 revenue was $94.9B",
        "answer": "Apple's Q4 2024 revenue was $94.9B",
    }


# Run some requests (in production, this happens naturally)
print("Running monitored requests...")
for i in range(50):
    result = my_rag("What was Apple's Q4 revenue?")

print("✓ Monitoring complete\n")

# ============================================
# STEP 2: Generate compliance report
# ============================================

# Generate text report (for humans)
print("Generating compliance report...")
report_path = cert.export_report(
    output_path="compliance_report.txt", system_name="Customer Service RAG"
)

print(f"✓ Report generated: {report_path}\n")

# ============================================
# STEP 3: View report in terminal
# ============================================

# Show report directly in terminal
cert.show_report(system_name="Customer Service RAG")

# ============================================
# OTHER FORMATS
# ============================================

# Generate JSON report (for programmatic access)
json_path = cert.export_report(
    output_path="compliance_report.json", system_name="Customer Service RAG", format="json"
)
print(f"\n✓ JSON report: {json_path}")

# Generate CSV report (for spreadsheets)
csv_path = cert.export_report(
    output_path="compliance_report.csv", system_name="Customer Service RAG", format="csv"
)
print(f"✓ CSV report: {csv_path}")

# ============================================
# WHAT THE REPORT SHOWS
# ============================================

print("\n" + "=" * 60)
print("What's in the compliance report:")
print("=" * 60)
print("""
ARTICLE 15.1 - ACCURACY
- Overall accuracy score (target: >90%)
- Semantic accuracy
- NLI contradiction score
- Grounding score
- Hallucination rate (target: <5%)
- Compliance rate

ARTICLE 15.4 - ROBUSTNESS
- Error rate (target: <5%)
- Success rate
- System resilience

ARTICLE 19 - AUDIT TRAIL
- Logging status
- Total requests logged
- Data retention period (minimum: 6 months)

RECOMMENDATIONS
- Specific actions if non-compliant
- Areas for improvement

DISCLAIMERS
- Legal context
- Compliance guidance
- Links to official EU AI Act resources
""")

print("=" * 60)
print("\nUse Cases:")
print("=" * 60)
print("""
1. REGULATORY AUDITS
   - Show report to auditors
   - Prove "appropriate levels of accuracy" (Article 15.1)
   - Demonstrate automatic logging (Article 19)

2. INTERNAL COMPLIANCE
   - Monthly compliance reviews
   - Track improvements over time
   - Document compliance efforts

3. STAKEHOLDER COMMUNICATION
   - Plain-English for non-technical teams
   - Executive summaries
   - Board presentations

4. CONTINUOUS MONITORING
   - Generate weekly/monthly reports
   - Track compliance trends
   - Early warning for drift
""")

print("=" * 60)
print("\n✓ Quickstart complete!")
print("\nKey Takeaways:")
print("- Report generated in seconds from audit log")
print("- Plain English for compliance teams")
print("- Multiple formats: TXT, JSON, CSV")
print("- Shows compliance status for Articles 15.1, 15.4, 19")
print("- Includes specific recommendations if non-compliant")
