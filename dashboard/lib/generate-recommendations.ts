/**
 * Dynamic content generation based on performance metrics.
 *
 * These functions generate context-aware text that changes based on actual
 * evaluation results. The logic should mirror Jinja2 conditionals in the
 * .docx template to ensure both renderers produce equivalent content.
 */

import { PerformanceMetrics } from '@/types/report-schema';

export function generateExecutiveSummary(metrics: PerformanceMetrics): string {
  const status =
    metrics.accuracy_percentage >= 90
      ? 'COMPLIANT'
      : metrics.accuracy_percentage >= 85
        ? 'ACCEPTABLE'
        : 'NON-COMPLIANT';

  return `This report provides comprehensive evaluation of AI system outputs against EU AI Act compliance requirements (Articles 15 & 19). The evaluation assessed ${metrics.total_traces} production traces for accuracy, relevance, and regulatory alignment.

Overall Status: ${status} (${metrics.accuracy_percentage.toFixed(1)}% accuracy)

This evaluation serves as technical documentation demonstrating compliance methodology and system performance as required by Article 15.`;
}

export function generateComplianceAssessment(metrics: PerformanceMetrics): string {
  const accuracy = metrics.accuracy_percentage;

  if (accuracy >= 90) {
    return `✓ COMPLIANT (≥90% Accuracy)

This system meets EU AI Act Article 15 accuracy requirements. The evaluation demonstrates ${accuracy.toFixed(1)}% accuracy across ${metrics.total_traces} traces, exceeding the 90% compliance threshold.

Recommended Actions:
• Continue monitoring performance through production deployment
• Review failed traces (${metrics.failed_traces}) to identify improvement opportunities
• Maintain current evaluation threshold (${metrics.threshold_used})
• Re-evaluate quarterly to ensure sustained compliance
• Document evaluation procedures for regulatory audits`;
  }

  if (accuracy >= 85) {
    return `⚠ ACCEPTABLE WITH MONITORING (85-90% Accuracy)

This system demonstrates ${accuracy.toFixed(1)}% accuracy, slightly below the recommended 90% threshold but within acceptable range. Additional monitoring is recommended.

Required Actions:
• Implement enhanced monitoring for production deployment
• Weekly review of failed traces (currently ${metrics.failed_traces}/${metrics.total_traces})
• Root cause analysis for systematic errors
• Re-evaluation in 30 days to assess trend
• Consider human oversight for low-confidence outputs
• Document risk mitigation measures`;
  }

  // Below 85% - non-compliant
  return `✗ NON-COMPLIANT (<85% Accuracy)

This system achieves only ${accuracy.toFixed(1)}% accuracy, significantly below the 90% compliance threshold. Immediate corrective action is required before production deployment.

Immediate Actions Required:
• HALT production deployment until accuracy improves
• Systematic review of ${metrics.failed_traces} failed traces (${((metrics.failed_traces / metrics.total_traces) * 100).toFixed(1)}% failure rate)
• Enhance training data quality and coverage
• Implement stricter output validation mechanisms
• Consider model fine-tuning or replacement
• Re-evaluation after corrective measures implemented

WARNING: This system should NOT be deployed in high-risk applications until compliance is achieved.`;
}

export function generateRiskClassification(metrics: PerformanceMetrics): string {
  const failureRate = (metrics.failed_traces / metrics.total_traces) * 100;

  if (failureRate < 5) {
    return `LOW RISK: Failure rate of ${failureRate.toFixed(1)}% indicates robust performance. System demonstrates consistent accuracy across evaluated traces with minimal error patterns.`;
  }

  if (failureRate < 15) {
    return `MODERATE RISK: Failure rate of ${failureRate.toFixed(1)}% requires attention. While within acceptable range, systematic monitoring is recommended to prevent performance degradation.`;
  }

  return `HIGH RISK: Failure rate of ${failureRate.toFixed(1)}% exceeds acceptable thresholds. This system poses significant compliance risk and should not be deployed without substantial improvements.`;
}

export function generateConfidenceAnalysis(metrics: PerformanceMetrics): string {
  const meanConf = metrics.mean_confidence;
  const medianConf = metrics.median_confidence;

  if (meanConf >= 0.85) {
    return `The system demonstrates high confidence in its outputs (mean: ${meanConf.toFixed(3)}, median: ${medianConf.toFixed(3)}), indicating strong alignment with source material. This confidence distribution suggests reliable performance across the evaluation set.`;
  }

  if (meanConf >= 0.70) {
    return `The system shows moderate confidence in outputs (mean: ${meanConf.toFixed(3)}, median: ${medianConf.toFixed(3)}). While meeting the threshold, this suggests some uncertainty that may benefit from additional validation or training data enhancement.`;
  }

  return `The system exhibits low confidence in outputs (mean: ${meanConf.toFixed(3)}, median: ${medianConf.toFixed(3)}), indicating significant uncertainty. This confidence pattern suggests systematic issues requiring investigation and corrective action.`;
}

export function generateRecommendations(metrics: PerformanceMetrics): {
  immediate: string[];
  shortTerm: string[];
  longTerm: string[];
} {
  const accuracy = metrics.accuracy_percentage;

  if (accuracy >= 90) {
    return {
      immediate: [
        'Continue monitoring to ensure sustained compliance',
        'Document evaluation procedures for audits',
        'Maintain audit trails for all system outputs',
      ],
      shortTerm: [
        'Establish periodic re-evaluation schedule (quarterly recommended)',
        'Implement automated performance monitoring',
        'Review failed traces for improvement opportunities',
      ],
      longTerm: [
        'Build historical performance database for trend analysis',
        'Develop domain-specific evaluation benchmarks',
        'Consider A/B testing for system improvements',
      ],
    };
  }

  if (accuracy >= 85) {
    return {
      immediate: [
        'Implement enhanced monitoring for production deployment',
        'Begin weekly failed trace reviews',
        'Document risk mitigation measures',
      ],
      shortTerm: [
        'Conduct root cause analysis of failure patterns',
        'Consider human oversight for low-confidence outputs',
        'Re-evaluate in 30 days to assess trend',
        'Enhance validation mechanisms',
      ],
      longTerm: [
        'Systematic training data quality improvements',
        'Develop automated anomaly detection',
        'Plan for quarterly compliance reviews',
      ],
    };
  }

  // Below 85%
  return {
    immediate: [
      'HALT production deployment until accuracy improves',
      'Initiate emergency review of all failed traces',
      'Identify and address systematic error patterns',
      'Implement stricter output validation',
    ],
    shortTerm: [
      'Enhance training data quality and coverage',
      'Consider model fine-tuning or replacement',
      'Implement multi-stage validation pipeline',
      'Re-evaluate after corrective measures',
    ],
    longTerm: [
      'Develop comprehensive quality assurance framework',
      'Build continuous monitoring infrastructure',
      'Establish automated regression testing',
      'Create escalation procedures for compliance issues',
    ],
  };
}
