/**
 * CERT Framework ROI Calculator
 * Pure business logic for calculating return on investment for AI automation
 */

import { ROIInputs, ROIOutputs } from '@/types/wizard';

/**
 * Calculate ROI for AI automation project
 *
 * Compares current manual process costs against estimated AI costs,
 * factoring in implementation costs, error rates, and human review requirements.
 */
export function calculateROI(inputs: ROIInputs): ROIOutputs {
  // Current monthly cost calculation
  const hoursPerTask = inputs.minutesPerTask / 60;
  const laborCostPerTask = hoursPerTask * inputs.laborCostPerHour;
  const currentLaborCost = inputs.tasksPerMonth * laborCostPerTask;

  const errorsPerMonth = inputs.tasksPerMonth * (inputs.errorRate / 100);
  const errorCost = errorsPerMonth * inputs.errorCostPerIncident;

  const currentMonthlyCost = currentLaborCost + errorCost;

  // AI monthly cost calculation
  const aiDirectCost = inputs.tasksPerMonth * inputs.aiCostPerTask;

  // Human review cost (assume review takes 30% of full task time)
  const tasksNeedingReview = inputs.tasksPerMonth * (inputs.humanReviewPercent / 100);
  const reviewCost = tasksNeedingReview * (hoursPerTask * 0.3 * inputs.laborCostPerHour);

  // AI error cost
  const aiErrorRate = 100 - inputs.aiSuccessRate;
  const aiErrorsPerMonth = inputs.tasksPerMonth * (aiErrorRate / 100);
  const aiErrorCost = aiErrorsPerMonth * inputs.errorCostPerIncident;

  const aiMonthlyCost = aiDirectCost + reviewCost + aiErrorCost;

  // Savings calculation
  const monthlySavings = currentMonthlyCost - aiMonthlyCost;
  const annualSavings = monthlySavings * 12;

  // ROI calculation
  const netAnnualSavings = annualSavings - inputs.implementationCost;
  const roiPercentage = inputs.implementationCost > 0
    ? (netAnnualSavings / inputs.implementationCost) * 100
    : 0;

  // Break-even calculation
  const breakEvenMonths = monthlySavings > 0
    ? inputs.implementationCost / monthlySavings
    : Infinity;

  // Confidence and risk assessment
  const confidenceLevel = assessConfidence(inputs);
  const risks = identifyRisks(inputs, breakEvenMonths);

  return {
    currentMonthlyCost,
    aiMonthlyCost,
    monthlySavings,
    annualSavings,
    roiPercentage,
    breakEvenMonths,
    confidenceLevel,
    risks
  };
}

/**
 * Assess confidence level in the ROI calculation
 */
function assessConfidence(inputs: ROIInputs): 'high' | 'medium' | 'low' {
  // High confidence: Well-defined task, good success rate, low error tolerance
  if (inputs.aiSuccessRate >= 85 && inputs.errorRate < 10) {
    return 'high';
  }

  // Low confidence: High error tolerance needed, complex task, low accuracy
  if (inputs.aiSuccessRate < 70 || inputs.errorRate > 20) {
    return 'low';
  }

  return 'medium';
}

/**
 * Identify potential risks in the AI implementation
 */
function identifyRisks(inputs: ROIInputs, breakEvenMonths: number): string[] {
  const risks: string[] = [];

  if (inputs.aiSuccessRate < 80) {
    risks.push('AI accuracy below 80% may require significant human oversight');
  }

  if (inputs.humanReviewPercent > 30) {
    risks.push('High review percentage (>30%) reduces automation benefits');
  }

  if (breakEvenMonths > 12) {
    risks.push('Long payback period (>12 months) increases implementation risk');
  }

  if (inputs.errorCostPerIncident > inputs.tasksPerMonth * inputs.aiCostPerTask * 0.1) {
    risks.push('High error costs mean AI failures are expensive - require robust testing');
  }

  if (inputs.aiCostPerTask > inputs.laborCostPerHour / 20) {
    risks.push('AI costs are significant relative to labor - consider cheaper models');
  }

  if (inputs.minutesPerTask < 5) {
    risks.push('Very short tasks may not benefit from AI automation overhead');
  }

  if (inputs.tasksPerMonth < 100) {
    risks.push('Low volume may not justify implementation costs - consider manual process improvements first');
  }

  return risks;
}

/**
 * Generate default ROI inputs for common scenarios
 */
export function getDefaultROIInputs(scenario: 'customer-service' | 'data-entry' | 'document-processing'): ROIInputs {
  const defaults: Record<string, ROIInputs> = {
    'customer-service': {
      tasksPerMonth: 5000,
      minutesPerTask: 8,
      laborCostPerHour: 20,
      errorRate: 5,
      errorCostPerIncident: 50,
      aiSuccessRate: 85,
      aiCostPerTask: 0.03,
      humanReviewPercent: 15,
      implementationCost: 75000
    },
    'data-entry': {
      tasksPerMonth: 10000,
      minutesPerTask: 5,
      laborCostPerHour: 15,
      errorRate: 8,
      errorCostPerIncident: 25,
      aiSuccessRate: 92,
      aiCostPerTask: 0.01,
      humanReviewPercent: 10,
      implementationCost: 50000
    },
    'document-processing': {
      tasksPerMonth: 2000,
      minutesPerTask: 20,
      laborCostPerHour: 30,
      errorRate: 10,
      errorCostPerIncident: 200,
      aiSuccessRate: 80,
      aiCostPerTask: 0.10,
      humanReviewPercent: 25,
      implementationCost: 100000
    }
  };

  return defaults[scenario];
}
