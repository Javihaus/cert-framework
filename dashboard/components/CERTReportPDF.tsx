import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { Article15Report } from '@/types/report-schema';
import { COMPLIANCE_TEXT } from '@/content/compliance-text';
import {
  generateExecutiveSummary,
  generateComplianceAssessment,
  generateRiskClassification,
  generateConfidenceAnalysis,
  generateRecommendations,
} from '@/lib/generate-recommendations';

// Register fonts (using built-in fonts)
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica', fontWeight: 'normal' },
    { src: 'Helvetica-Bold', fontWeight: 'bold' },
  ],
});

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.6,
  },
  // Header styles
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #1A365D',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A365D',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#4A5568',
    marginBottom: 3,
  },
  // Section styles
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A365D',
    marginBottom: 10,
    borderBottom: '1 solid #E2E8F0',
    paddingBottom: 5,
  },
  // Metrics box
  metricsBox: {
    backgroundColor: '#F7FAFC',
    border: '1 solid #E2E8F0',
    borderRadius: 4,
    padding: 15,
    marginBottom: 15,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 10,
    color: '#4A5568',
  },
  metricValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1A365D',
  },
  // Status badge
  statusBadge: {
    padding: '4 12',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  compliant: {
    backgroundColor: '#C6F6D5',
    color: '#22543D',
  },
  nonCompliant: {
    backgroundColor: '#FED7D7',
    color: '#742A2A',
  },
  // Text styles
  paragraph: {
    fontSize: 10,
    color: '#2D3748',
    marginBottom: 10,
    lineHeight: 1.7,
  },
  bulletPoint: {
    fontSize: 10,
    color: '#2D3748',
    marginBottom: 6,
    marginLeft: 15,
  },
  // Table styles
  table: {
    marginTop: 10,
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#EDF2F7',
    borderBottom: '1 solid #CBD5E0',
    padding: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5 solid #E2E8F0',
    padding: 8,
  },
  tableCell: {
    fontSize: 9,
    flex: 1,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 8,
    color: '#718096',
    borderTop: '0.5 solid #E2E8F0',
    paddingTop: 10,
  },
  pageNumber: {
    fontSize: 8,
    color: '#718096',
  },
});

interface CERTReportPDFProps {
  report: Article15Report;
}

export const CERTReportPDF: React.FC<CERTReportPDFProps> = ({ report }) => {
  const isCompliant = report.performance.accuracy_percentage >= 90;
  const topFailures = report.failed_traces.slice(0, 10);

  // Generate dynamic content
  const executiveSummary = generateExecutiveSummary(report.performance);
  const complianceAssessment = generateComplianceAssessment(report.performance);
  const riskClassification = generateRiskClassification(report.performance);
  const confidenceAnalysis = generateConfidenceAnalysis(report.performance);
  const recommendations = generateRecommendations(report.performance);

  return (
    <Document>
      {/* Page 1: Executive Summary */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>EU AI Act Article 15 Compliance Report</Text>
          <Text style={styles.subtitle}>System: {report.metadata.system_name} {report.metadata.system_version}</Text>
          <Text style={styles.subtitle}>Provider: {report.metadata.provider_name}</Text>
          {report.metadata.evaluator_name && (
            <Text style={styles.subtitle}>Evaluator: {report.metadata.evaluator_name}</Text>
          )}
          <Text style={styles.subtitle}>
            Generated: {new Date(report.metadata.report_date).toLocaleString()}
          </Text>
        </View>

        {/* Executive Summary - Dynamic */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <Text style={styles.paragraph}>{executiveSummary}</Text>

          {/* Compliance Status Badge */}
          <View
            style={[
              styles.statusBadge,
              isCompliant ? styles.compliant : styles.nonCompliant,
            ]}
          >
            <Text>
              {isCompliant
                ? '✓ COMPLIANT (≥90% Accuracy)'
                : '✗ NON-COMPLIANT (<90% Accuracy)'}
            </Text>
          </View>
        </View>

        {/* Regulatory Framework - Static */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Regulatory Framework</Text>
          <Text style={styles.paragraph}>{COMPLIANCE_TEXT.article15_definition}</Text>
          <Text style={styles.paragraph}>{COMPLIANCE_TEXT.article15_requirements}</Text>
        </View>

        {/* Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evaluation Metrics</Text>
          <View style={styles.metricsBox}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Total Traces Evaluated</Text>
              <Text style={styles.metricValue}>{report.performance.total_traces}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Overall Accuracy</Text>
              <Text style={styles.metricValue}>
                {report.performance.accuracy_percentage.toFixed(2)}%
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Passed Traces</Text>
              <Text style={[styles.metricValue, { color: '#22543D' }]}>
                {report.performance.passed_traces}
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Failed Traces</Text>
              <Text style={[styles.metricValue, { color: '#742A2A' }]}>
                {report.performance.failed_traces}
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Mean Confidence Score</Text>
              <Text style={styles.metricValue}>
                {report.performance.mean_confidence.toFixed(3)}
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Threshold Applied</Text>
              <Text style={styles.metricValue}>{report.performance.threshold_used}</Text>
            </View>
          </View>
        </View>

        {/* Evaluation Methodology - Static */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evaluation Methodology</Text>
          <Text style={styles.paragraph}>{COMPLIANCE_TEXT.methodology_overview}</Text>
          <Text style={styles.paragraph}>{COMPLIANCE_TEXT.evaluation_process}</Text>
          <Text style={styles.paragraph}>{COMPLIANCE_TEXT.compliance_interpretation}</Text>
        </View>

        {/* Footer */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `CERT Compliance Report • Page ${pageNumber} of ${totalPages} • ${COMPLIANCE_TEXT.footer_note}`
          }
          fixed
        />
      </Page>

      {/* Page 2: Detailed Analysis */}
      <Page size="A4" style={styles.page}>
        {/* Confidence Analysis - Dynamic */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Confidence Score Analysis</Text>
          <Text style={styles.paragraph}>{COMPLIANCE_TEXT.score_distribution_intro}</Text>
          <Text style={styles.paragraph}>{confidenceAnalysis}</Text>

          {/* Confidence Metrics */}
          <View style={styles.metricsBox}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Mean Confidence</Text>
              <Text style={styles.metricValue}>{report.performance.mean_confidence.toFixed(3)}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Median Confidence</Text>
              <Text style={styles.metricValue}>{report.performance.median_confidence.toFixed(3)}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Threshold Applied</Text>
              <Text style={styles.metricValue}>{report.performance.threshold_used}</Text>
            </View>
          </View>
        </View>

        {/* Failed Trace Analysis */}
        {report.failed_traces.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Failed Trace Analysis</Text>
            <Text style={styles.paragraph}>{COMPLIANCE_TEXT.failed_trace_intro}</Text>

            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Query</Text>
                <Text style={styles.tableCell}>Confidence</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>Reason</Text>
              </View>
              {topFailures.map((trace, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {trace.input_query?.substring(0, 40) || 'N/A'}
                    {(trace.input_query?.length || 0) > 40 ? '...' : ''}
                  </Text>
                  <Text style={styles.tableCell}>
                    {trace.confidence.toFixed(3)}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {trace.reason.substring(0, 50)}
                    {trace.reason.length > 50 ? '...' : ''}
                  </Text>
                </View>
              ))}
            </View>
            {report.failed_traces.length > 10 && (
              <Text style={[styles.paragraph, { fontSize: 9, fontStyle: 'italic' }]}>
                Showing top 10 of {report.failed_traces.length} failed traces
              </Text>
            )}
          </View>
        )}

        {/* Footer */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `CERT Compliance Report • Page ${pageNumber} of ${totalPages} • ${COMPLIANCE_TEXT.footer_note}`
          }
          fixed
        />
      </Page>

      {/* Page 3: Compliance Assessment & Recommendations */}
      <Page size="A4" style={styles.page}>
        {/* Compliance Assessment - Dynamic */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compliance Assessment</Text>
          <Text style={styles.paragraph}>{complianceAssessment}</Text>
        </View>

        {/* Risk Classification - Dynamic */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk Classification</Text>
          <Text style={styles.paragraph}>{riskClassification}</Text>
        </View>

        {/* Recommendations - Dynamic */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>

          <Text style={[styles.paragraph, { fontWeight: 'bold', marginTop: 5 }]}>
            Immediate Actions:
          </Text>
          {recommendations.immediate.map((rec, idx) => (
            <Text key={idx} style={styles.bulletPoint}>• {rec}</Text>
          ))}

          <Text style={[styles.paragraph, { fontWeight: 'bold', marginTop: 10 }]}>
            Short-Term (30-90 days):
          </Text>
          {recommendations.shortTerm.map((rec, idx) => (
            <Text key={idx} style={styles.bulletPoint}>• {rec}</Text>
          ))}

          <Text style={[styles.paragraph, { fontWeight: 'bold', marginTop: 10 }]}>
            Long-Term (6-12 months):
          </Text>
          {recommendations.longTerm.map((rec, idx) => (
            <Text key={idx} style={styles.bulletPoint}>• {rec}</Text>
          ))}
        </View>

        {/* EU AI Act Alignment Notes - Static */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Regulatory Alignment Notes</Text>
          <Text style={styles.paragraph}>{COMPLIANCE_TEXT.article15_detailed}</Text>
          <Text style={styles.paragraph}>{COMPLIANCE_TEXT.article19_detailed}</Text>
        </View>

        {/* System-Specific Methodology */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System-Specific Evaluation Details</Text>
          <Text style={styles.paragraph}>{report.evaluation_methodology}</Text>
        </View>

        {/* Compliance Statement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compliance Statement</Text>
          <Text style={styles.paragraph}>{report.compliance_statement}</Text>
        </View>

        {/* Evaluation Period */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evaluation Period</Text>
          <Text style={styles.paragraph}>
            Start: {new Date(report.temporal.period_start).toLocaleString()}
          </Text>
          <Text style={styles.paragraph}>
            End: {new Date(report.temporal.period_end).toLocaleString()}
          </Text>
          <Text style={styles.paragraph}>
            Duration: {report.temporal.daily_accuracy.length} days of monitoring
          </Text>
        </View>

        {/* Footer */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `CERT Compliance Report • Page ${pageNumber} of ${totalPages} • ${COMPLIANCE_TEXT.footer_note}`
          }
          fixed
        />
      </Page>
    </Document>
  );
};
