import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { EvaluationSummary, EvaluationResult } from '@/types/cert';

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

interface ReportMetadata {
  title: string;
  organization?: string;
  evaluator?: string;
  notes?: string;
  generated_date: string;
}

interface CERTReportPDFProps {
  summary: EvaluationSummary;
  results: EvaluationResult[];
  metadata: ReportMetadata;
}

export const CERTReportPDF: React.FC<CERTReportPDFProps> = ({
  summary,
  results,
  metadata,
}) => {
  const isCompliant = summary.accuracy >= 0.9;
  const failedTraces = results.filter((r) => !r.passed);
  const topFailures = failedTraces.slice(0, 10);

  return (
    <Document>
      {/* Page 1: Executive Summary */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{metadata.title}</Text>
          {metadata.organization && (
            <Text style={styles.subtitle}>Organization: {metadata.organization}</Text>
          )}
          {metadata.evaluator && (
            <Text style={styles.subtitle}>Evaluator: {metadata.evaluator}</Text>
          )}
          <Text style={styles.subtitle}>
            Generated: {new Date(metadata.generated_date).toLocaleString()}
          </Text>
        </View>

        {/* Executive Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <Text style={styles.paragraph}>
            This report provides a comprehensive evaluation of AI system outputs against
            compliance requirements defined in the EU AI Act (Articles 15 & 19). The
            evaluation assesses {summary.total_traces} traces for accuracy, relevance,
            and regulatory alignment.
          </Text>

          {/* Compliance Status */}
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

        {/* Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evaluation Metrics</Text>
          <View style={styles.metricsBox}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Total Traces Evaluated</Text>
              <Text style={styles.metricValue}>{summary.total_traces}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Overall Accuracy</Text>
              <Text style={styles.metricValue}>
                {(summary.accuracy * 100).toFixed(2)}%
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Passed Traces</Text>
              <Text style={[styles.metricValue, { color: '#22543D' }]}>
                {summary.passed_traces}
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Failed Traces</Text>
              <Text style={[styles.metricValue, { color: '#742A2A' }]}>
                {summary.failed_traces}
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Mean Confidence Score</Text>
              <Text style={styles.metricValue}>
                {summary.mean_confidence.toFixed(3)}
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Threshold Applied</Text>
              <Text style={styles.metricValue}>{summary.threshold_used}</Text>
            </View>
          </View>
        </View>

        {/* Compliance Assessment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compliance Assessment</Text>
          <Text style={styles.paragraph}>
            <Text style={{ fontWeight: 'bold' }}>EU AI Act Alignment:</Text> This
            evaluation addresses requirements under Article 15 (Accuracy, Robustness,
            Cybersecurity) and Article 19 (Transparency Obligations for High-Risk AI Systems).
          </Text>
          <Text style={styles.paragraph}>
            <Text style={{ fontWeight: 'bold' }}>Risk Classification:</Text> Based on
            the evaluation results, the system demonstrates{' '}
            {isCompliant
              ? 'strong compliance with regulatory accuracy thresholds (≥90%).'
              : 'accuracy below the recommended threshold, indicating potential compliance gaps.'}
          </Text>
        </View>

        {/* Footer */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `CERT Compliance Report • Page ${pageNumber} of ${totalPages} • Generated by CERT Framework v4.0`
          }
          fixed
        />
      </Page>

      {/* Page 2: Detailed Analysis */}
      <Page size="A4" style={styles.page}>
        {/* Score Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Score Distribution Analysis</Text>
          <Text style={styles.paragraph}>
            The confidence score distribution provides insights into the reliability of
            system outputs:
          </Text>
          <Text style={styles.bulletPoint}>
            • High Confidence (≥0.9): {results.filter((r) => r.measurement.confidence >= 0.9).length} traces
          </Text>
          <Text style={styles.bulletPoint}>
            • Medium Confidence (0.7-0.9): {results.filter((r) => r.measurement.confidence >= 0.7 && r.measurement.confidence < 0.9).length} traces
          </Text>
          <Text style={styles.bulletPoint}>
            • Low Confidence (<0.7): {results.filter((r) => r.measurement.confidence < 0.7).length} traces
          </Text>
        </View>

        {/* Failed Trace Analysis */}
        {failedTraces.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Failed Trace Analysis</Text>
            <Text style={styles.paragraph}>
              Analysis of failed traces reveals patterns requiring attention:
            </Text>

            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Query</Text>
                <Text style={styles.tableCell}>Confidence</Text>
                <Text style={styles.tableCell}>Status</Text>
              </View>
              {topFailures.map((trace, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {trace.query.substring(0, 60)}
                    {trace.query.length > 60 ? '...' : ''}
                  </Text>
                  <Text style={styles.tableCell}>
                    {trace.measurement.confidence.toFixed(3)}
                  </Text>
                  <Text style={[styles.tableCell, { color: '#742A2A' }]}>Failed</Text>
                </View>
              ))}
            </View>
            {failedTraces.length > 10 && (
              <Text style={[styles.paragraph, { fontSize: 9, fontStyle: 'italic' }]}>
                Showing top 10 of {failedTraces.length} failed traces
              </Text>
            )}
          </View>
        )}

        {/* Footer */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `CERT Compliance Report • Page ${pageNumber} of ${totalPages} • Generated by CERT Framework v4.0`
          }
          fixed
        />
      </Page>

      {/* Page 3: Recommendations */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {isCompliant ? (
            <>
              <Text style={styles.paragraph}>
                <Text style={{ fontWeight: 'bold' }}>Maintain Compliance:</Text> The system
                demonstrates strong performance. Continue monitoring to ensure sustained
                compliance:
              </Text>
              <Text style={styles.bulletPoint}>
                • Implement continuous monitoring to detect performance degradation
              </Text>
              <Text style={styles.bulletPoint}>
                • Document evaluation procedures for regulatory audits
              </Text>
              <Text style={styles.bulletPoint}>
                • Establish periodic re-evaluation schedules (quarterly recommended)
              </Text>
              <Text style={styles.bulletPoint}>
                • Maintain audit trails for all system outputs
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.paragraph}>
                <Text style={{ fontWeight: 'bold' }}>Immediate Action Required:</Text> The
                system accuracy falls below compliance thresholds. Recommended actions:
              </Text>
              <Text style={styles.bulletPoint}>
                • Review and address failed trace patterns systematically
              </Text>
              <Text style={styles.bulletPoint}>
                • Enhance training data quality and coverage
              </Text>
              <Text style={styles.bulletPoint}>
                • Implement stricter output validation mechanisms
              </Text>
              <Text style={styles.bulletPoint}>
                • Consider human oversight for low-confidence outputs
              </Text>
              <Text style={styles.bulletPoint}>
                • Re-evaluate after implementing corrective measures
              </Text>
            </>
          )}
        </View>

        {/* EU AI Act Alignment Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Regulatory Alignment Notes</Text>
          <Text style={styles.paragraph}>
            <Text style={{ fontWeight: 'bold' }}>Article 15 (Accuracy & Robustness):</Text>{' '}
            This evaluation assesses accuracy across a representative dataset. Systems must
            achieve and maintain appropriate levels of accuracy throughout their lifecycle.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={{ fontWeight: 'bold' }}>Article 19 (Transparency):</Text> High-risk
            AI systems must provide sufficient information to enable users to interpret and
            use system outputs appropriately. This report serves as documentation of system
            performance and reliability.
          </Text>
        </View>

        {/* Additional Notes */}
        {metadata.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <Text style={styles.paragraph}>{metadata.notes}</Text>
          </View>
        )}

        {/* Evaluation Period */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evaluation Period</Text>
          <Text style={styles.paragraph}>
            Start: {new Date(summary.date_range.start).toLocaleString()}
          </Text>
          <Text style={styles.paragraph}>
            End: {new Date(summary.date_range.end).toLocaleString()}
          </Text>
        </View>

        {/* Footer */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `CERT Compliance Report • Page ${pageNumber} of ${totalPages} • Generated by CERT Framework v4.0`
          }
          fixed
        />
      </Page>
    </Document>
  );
};
