import { ReadinessInputs, ReadinessOutputs } from '@/types/wizard';

/**
 * Assess organizational readiness for AI implementation
 * Pure function - no side effects, fully testable
 */
export function assessReadiness(inputs: ReadinessInputs): ReadinessOutputs {
  // Calculate capability scores (0-100)
  const dataScore = calculateDataScore(inputs);
  const technicalScore = calculateTechnicalScore(inputs);
  const organizationalScore = calculateOrganizationalScore(inputs);
  const complianceScore = calculateComplianceScore(inputs);

  // Overall readiness (weighted average)
  const overallScore = Math.round(
    dataScore * 0.3 +
    technicalScore * 0.3 +
    organizationalScore * 0.2 +
    complianceScore * 0.2
  );

  // Classify readiness level
  const readinessLevel = classifyReadinessLevel(overallScore);

  // Identify gaps
  const gaps = identifyGaps(inputs, {
    dataScore,
    technicalScore,
    organizationalScore,
    complianceScore
  });

  // Calculate estimated timeline
  const estimatedTimelineWeeks = calculateTimeline(gaps, inputs.timelineWeeks);

  // Generate recommendations
  const recommendations = generateRecommendations(gaps, readinessLevel);

  return {
    overallScore,
    readinessLevel,
    categoryScores: {
      data: dataScore,
      technical: technicalScore,
      organizational: organizationalScore,
      compliance: complianceScore
    },
    gaps,
    estimatedTimelineWeeks,
    recommendations,
    riskFactors: identifyRiskFactors(inputs, overallScore)
  };
}

function calculateDataScore(inputs: ReadinessInputs): number {
  let score = 0;

  // Has data strategy (40 points)
  if (inputs.hasDataStrategy) score += 40;

  // Has labeled data (30 points)
  if (inputs.hasLabeledData) score += 30;

  // Data quality (30 points)
  if (inputs.dataQuality === 'high') score += 30;
  else if (inputs.dataQuality === 'medium') score += 15;

  return score;
}

function calculateTechnicalScore(inputs: ReadinessInputs): number {
  let score = 0;

  // ML experience (35 points)
  if (inputs.hasMLExperience) score += 35;

  // Infrastructure (35 points)
  if (inputs.hasInfrastructure) score += 35;

  // Team size (30 points)
  if (inputs.teamSize >= 5) score += 30;
  else if (inputs.teamSize >= 3) score += 20;
  else if (inputs.teamSize >= 1) score += 10;

  return score;
}

function calculateOrganizationalScore(inputs: ReadinessInputs): number {
  let score = 0;

  // Executive support (40 points)
  if (inputs.hasExecutiveSupport) score += 40;

  // Change management (30 points)
  if (inputs.hasChangeManagement) score += 30;

  // Budget allocated (30 points)
  if (inputs.hasBudgetAllocated) score += 30;

  return score;
}

function calculateComplianceScore(inputs: ReadinessInputs): number {
  let score = 0;

  // Compliance framework (50 points)
  if (inputs.hasComplianceFramework) score += 50;

  // Security measures (50 points)
  if (inputs.hasSecurityMeasures) score += 50;

  return score;
}

function classifyReadinessLevel(score: number): 'ready' | 'needs-preparation' | 'not-ready' {
  if (score >= 70) return 'ready';
  if (score >= 40) return 'needs-preparation';
  return 'not-ready';
}

interface ScoreBreakdown {
  dataScore: number;
  technicalScore: number;
  organizationalScore: number;
  complianceScore: number;
}

function identifyGaps(inputs: ReadinessInputs, scores: ScoreBreakdown): string[] {
  const gaps: string[] = [];

  // Data gaps
  if (!inputs.hasDataStrategy) {
    gaps.push('No formal data strategy or governance framework');
  }
  if (!inputs.hasLabeledData) {
    gaps.push('Limited or no labeled training data available');
  }
  if (inputs.dataQuality === 'low') {
    gaps.push('Data quality issues need to be addressed');
  }

  // Technical gaps
  if (!inputs.hasMLExperience) {
    gaps.push('Team lacks ML/AI implementation experience');
  }
  if (!inputs.hasInfrastructure) {
    gaps.push('Cloud infrastructure for AI workloads not in place');
  }
  if (inputs.teamSize < 3) {
    gaps.push('Team size too small - consider hiring or partnering');
  }

  // Organizational gaps
  if (!inputs.hasExecutiveSupport) {
    gaps.push('Need executive sponsorship and budget commitment');
  }
  if (!inputs.hasChangeManagement) {
    gaps.push('Change management plan required for user adoption');
  }
  if (!inputs.hasBudgetAllocated) {
    gaps.push('Budget needs formal allocation and approval');
  }

  // Compliance gaps
  if (!inputs.hasComplianceFramework) {
    gaps.push('Compliance and audit framework needs development');
  }
  if (!inputs.hasSecurityMeasures) {
    gaps.push('Security and privacy measures need implementation');
  }

  return gaps;
}

function calculateTimeline(gaps: string[], userEstimate: number): number {
  // Base timeline on number of gaps
  const gapCount = gaps.length;

  // Each gap adds ~2 weeks
  const baselineWeeks = Math.max(4, gapCount * 2);

  // If user provided estimate, take the maximum (more conservative)
  return userEstimate > 0 ? Math.max(baselineWeeks, userEstimate) : baselineWeeks;
}

function generateRecommendations(gaps: string[], level: string): string[] {
  const recommendations: string[] = [];

  if (level === 'ready') {
    recommendations.push('Start with a pilot project to validate assumptions');
    recommendations.push('Establish metrics and monitoring from day one');
    recommendations.push('Plan for iterative improvement and model updates');
    recommendations.push('Document decisions for compliance and knowledge transfer');
  } else if (level === 'needs-preparation') {
    recommendations.push('Address critical gaps (data, infrastructure) first');
    recommendations.push('Consider phased implementation starting with low-risk use case');
    recommendations.push('Invest in team training or hire AI specialists');
    recommendations.push('Establish governance and compliance processes early');
  } else {
    recommendations.push('Secure executive sponsorship before technical work');
    recommendations.push('Develop comprehensive data strategy and governance');
    recommendations.push('Build or acquire technical infrastructure and talent');
    recommendations.push('Start with AI readiness assessment and roadmap creation');
    recommendations.push('Consider external consulting for initial guidance');
  }

  // Add gap-specific recommendations
  if (gaps.some(g => g.includes('data strategy'))) {
    recommendations.push('Engage data governance consultant to establish framework');
  }
  if (gaps.some(g => g.includes('ML/AI implementation experience'))) {
    recommendations.push('Hire senior ML engineer or engage AI consultancy');
  }
  if (gaps.some(g => g.includes('compliance'))) {
    recommendations.push('Work with legal team to establish AI compliance program');
  }

  return recommendations;
}

function identifyRiskFactors(inputs: ReadinessInputs, score: number): string[] {
  const risks: string[] = [];

  if (score < 40) {
    risks.push('High risk of project failure without significant preparation');
  }

  if (!inputs.hasExecutiveSupport) {
    risks.push('Lack of executive support may lead to budget cuts or scope reduction');
  }

  if (!inputs.hasChangeManagement) {
    risks.push('Poor user adoption likely without change management plan');
  }

  if (inputs.teamSize < 2) {
    risks.push('Single point of failure - no redundancy in team');
  }

  if (!inputs.hasSecurityMeasures && !inputs.hasComplianceFramework) {
    risks.push('Compliance violation risk - may block production deployment');
  }

  if (inputs.dataQuality === 'low') {
    risks.push('Poor data quality will result in unreliable AI outputs');
  }

  if (inputs.timelineWeeks < 12 && score < 70) {
    risks.push('Aggressive timeline given current readiness - high risk of delays');
  }

  return risks;
}
