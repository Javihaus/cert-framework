/**
 * CERT Framework EU AI Act Risk Classifier
 * Pure business logic for classifying AI systems according to EU AI Act
 */

import { RiskInputs, RiskOutputs } from '@/types/wizard';

/**
 * Classify AI system risk level according to EU AI Act
 *
 * Checks prohibited uses (Article 5), high-risk systems (Annex III),
 * limited-risk (transparency requirements), and minimal-risk systems.
 */
export function classifyRisk(inputs: RiskInputs): RiskOutputs {
  // Check prohibited uses first (Article 5)
  if (inputs.biometricIdentification) {
    return {
      classification: 'prohibited',
      triggeredCriteria: ['Real-time biometric identification in public spaces (Article 5.1.d)'],
      complianceRequirements: ['System cannot be deployed under EU AI Act'],
      estimatedComplianceCost: { low: 0, high: 0 },
      estimatedTimeMonths: { low: 0, high: 0 },
      prohibitionReason: 'Real-time biometric identification is prohibited except for specific law enforcement cases'
    };
  }

  if (inputs.socialScoring) {
    return {
      classification: 'prohibited',
      triggeredCriteria: ['Social scoring by public authorities or on their behalf (Article 5.1.c)'],
      complianceRequirements: ['System cannot be deployed under EU AI Act'],
      estimatedComplianceCost: { low: 0, high: 0 },
      estimatedTimeMonths: { low: 0, high: 0 },
      prohibitionReason: 'Social scoring systems that lead to detrimental treatment are prohibited'
    };
  }

  if (inputs.manipulativeTechniques) {
    return {
      classification: 'prohibited',
      triggeredCriteria: ['Manipulative or deceptive techniques causing significant harm (Article 5.1.a)'],
      complianceRequirements: ['System cannot be deployed under EU AI Act'],
      estimatedComplianceCost: { low: 0, high: 0 },
      estimatedTimeMonths: { low: 0, high: 0 },
      prohibitionReason: 'AI systems that manipulate human behavior causing significant harm are prohibited'
    };
  }

  if (inputs.exploitVulnerabilities) {
    return {
      classification: 'prohibited',
      triggeredCriteria: ['Exploits vulnerabilities of specific groups causing significant harm (Article 5.1.b)'],
      complianceRequirements: ['System cannot be deployed under EU AI Act'],
      estimatedComplianceCost: { low: 0, high: 0 },
      estimatedTimeMonths: { low: 0, high: 0 },
      prohibitionReason: 'AI systems exploiting vulnerabilities (age, disability, socio-economic situation) are prohibited'
    };
  }

  // Check high-risk criteria (Annex III)
  const triggeredCriteria: string[] = [];

  if (inputs.criticalInfrastructure) {
    triggeredCriteria.push('Safety component in critical infrastructure - energy, water, gas, heating, transport (Annex III.2)');
  }

  if (inputs.educationAccess) {
    triggeredCriteria.push('Determines access to or admission to educational institutions or vocational training (Annex III.3.a)');
  }

  if (inputs.employmentDecisions) {
    triggeredCriteria.push('Recruitment, evaluation, promotion, termination, or task allocation decisions (Annex III.4.a-b)');
  }

  if (inputs.essentialServicesAccess) {
    triggeredCriteria.push('Evaluates credit worthiness, eligibility for insurance, or access to essential services (Annex III.5.a-b)');
  }

  if (inputs.lawEnforcement) {
    triggeredCriteria.push('Law enforcement applications - risk assessment, polygraph, emotion recognition, deep fakes (Annex III.6)');
  }

  if (inputs.migrationAsylumBorder) {
    triggeredCriteria.push('Migration, asylum, or border control management - risk assessment, verification, complaints (Annex III.7)');
  }

  if (inputs.justiceAdministration) {
    triggeredCriteria.push('Administration of justice - researching and interpreting facts and law (Annex III.8)');
  }

  if (inputs.democraticProcesses) {
    triggeredCriteria.push('Influences democratic processes, electoral behavior, or voting outcomes (Annex III.9)');
  }

  // Classify based on triggered criteria
  if (triggeredCriteria.length > 0) {
    return buildHighRiskOutput(triggeredCriteria, inputs);
  }

  // Check for limited risk (transparency requirements)
  if (inputs.decisionsPerYear > 1000 || inputs.affectedIndividuals > 100) {
    return {
      classification: 'limited-risk',
      triggeredCriteria: ['General-purpose AI system with significant user base'],
      complianceRequirements: [
        'Transparency obligations (Article 52)',
        'Disclose that users are interacting with AI',
        'Provide information about capabilities and limitations',
        'Ensure AI-generated content is machine-detectable'
      ],
      estimatedComplianceCost: { low: 5000, high: 25000 },
      estimatedTimeMonths: { low: 1, high: 3 }
    };
  }

  // Default to minimal risk
  return {
    classification: 'minimal-risk',
    triggeredCriteria: [],
    complianceRequirements: [
      'No mandatory requirements under EU AI Act',
      'Voluntary codes of conduct encouraged (Article 69)',
      'General product safety and liability laws apply'
    ],
    estimatedComplianceCost: { low: 0, high: 0 },
    estimatedTimeMonths: { low: 0, high: 0 }
  };
}

/**
 * Build high-risk output with full compliance requirements
 */
function buildHighRiskOutput(triggeredCriteria: string[], inputs: RiskInputs): RiskOutputs {
  const baseCompliance = [
    'Risk management system throughout lifecycle (Article 9)',
    'Data governance and management quality (Article 10)',
    'Technical documentation per Annex IV (Article 11)',
    'Record-keeping - automatic logs, minimum 6 months retention (Article 12)',
    'Transparency and user information (Article 13)',
    'Human oversight measures - design for human intervention (Article 14)',
    'Accuracy, robustness, and cybersecurity requirements (Article 15)',
    'Quality management system (Article 17)',
    'Conformity assessment - internal control (Annex VI) OR third-party (Annex VII)',
    'Registration in EU database before market placement',
    'Fundamental rights impact assessment if high-risk',
    'CE marking and EU declaration of conformity',
    'Post-market monitoring system (Article 72)',
    'Serious incident reporting - 15 days general, 2 days for fundamental rights violations'
  ];

  // Add specific requirements based on triggered criteria
  if (triggeredCriteria.some(c => c.includes('employment') || c.includes('Recruitment'))) {
    baseCompliance.push('Work council or employee representative consultation requirements');
    baseCompliance.push('Notification to candidates and employees about AI use');
    baseCompliance.push('Right to explanation of automated decisions');
  }

  if (triggeredCriteria.some(c => c.includes('law enforcement'))) {
    baseCompliance.push('Enhanced oversight by data protection authorities');
    baseCompliance.push('Logging requirements for all operations performed');
    baseCompliance.push('Special authorization requirements for certain uses');
  }

  if (triggeredCriteria.some(c => c.includes('credit') || c.includes('insurance'))) {
    baseCompliance.push('Right to human review of automated decisions');
    baseCompliance.push('Explanation of decision logic to affected individuals');
  }

  // Cost estimation based on complexity
  const complexityCriteria = triggeredCriteria.length;
  const volumeFactor = inputs.decisionsPerYear > 100000 ? 2 : inputs.decisionsPerYear > 10000 ? 1.5 : 1;
  const affectedFactor = inputs.affectedIndividuals > 10000 ? 1.5 : 1;

  const baseCostLow = 50000 * complexityCriteria * volumeFactor * affectedFactor;
  const baseCostHigh = 200000 * complexityCriteria * volumeFactor * affectedFactor;

  // Time estimation
  const baseTimeMonths = 6 + (complexityCriteria * 2);

  return {
    classification: 'high-risk',
    triggeredCriteria,
    complianceRequirements: baseCompliance,
    estimatedComplianceCost: {
      low: Math.max(baseCostLow, 75000),
      high: Math.min(baseCostHigh, 1000000)
    },
    estimatedTimeMonths: {
      low: Math.min(baseTimeMonths, 6),
      high: Math.max(baseTimeMonths + 6, 12)
    }
  };
}

/**
 * Get default risk inputs for common scenarios
 */
export function getDefaultRiskInputs(scenario: 'chatbot' | 'hr-screening' | 'credit-scoring'): RiskInputs {
  const defaults: Record<string, RiskInputs> = {
    'chatbot': {
      biometricIdentification: false,
      socialScoring: false,
      manipulativeTechniques: false,
      exploitVulnerabilities: false,
      criticalInfrastructure: false,
      educationAccess: false,
      employmentDecisions: false,
      essentialServicesAccess: false,
      lawEnforcement: false,
      migrationAsylumBorder: false,
      justiceAdministration: false,
      democraticProcesses: false,
      decisionsPerYear: 10000,
      affectedIndividuals: 5000
    },
    'hr-screening': {
      biometricIdentification: false,
      socialScoring: false,
      manipulativeTechniques: false,
      exploitVulnerabilities: false,
      criticalInfrastructure: false,
      educationAccess: false,
      employmentDecisions: true,
      essentialServicesAccess: false,
      lawEnforcement: false,
      migrationAsylumBorder: false,
      justiceAdministration: false,
      democraticProcesses: false,
      decisionsPerYear: 5000,
      affectedIndividuals: 10000
    },
    'credit-scoring': {
      biometricIdentification: false,
      socialScoring: false,
      manipulativeTechniques: false,
      exploitVulnerabilities: false,
      criticalInfrastructure: false,
      educationAccess: false,
      employmentDecisions: false,
      essentialServicesAccess: true,
      lawEnforcement: false,
      migrationAsylumBorder: false,
      justiceAdministration: false,
      democraticProcesses: false,
      decisionsPerYear: 50000,
      affectedIndividuals: 100000
    }
  };

  return defaults[scenario];
}
