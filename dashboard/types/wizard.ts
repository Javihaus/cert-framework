/**
 * CERT Framework Implementation Wizard
 * Data models for multi-step AI implementation planning
 */

// ============================================================================
// ROI Calculation
// ============================================================================

export interface ROIInputs {
  // Current manual process
  tasksPerMonth: number;          // How many tasks currently done manually
  minutesPerTask: number;          // Average time to complete one task
  laborCostPerHour: number;        // Fully-loaded cost (salary + benefits)
  errorRate: number;               // 0-100, percentage of tasks with errors
  errorCostPerIncident: number;    // Average cost when error occurs

  // AI system estimates
  aiSuccessRate: number;           // 0-100, expected accuracy
  aiCostPerTask: number;           // Model inference + infrastructure
  humanReviewPercent: number;      // 0-100, what % needs human review
  implementationCost: number;      // One-time setup cost
}

export interface ROIOutputs {
  currentMonthlyCost: number;
  aiMonthlyCost: number;
  monthlySavings: number;
  annualSavings: number;
  roiPercentage: number;
  breakEvenMonths: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  risks: string[];
}

// ============================================================================
// Risk Classification (EU AI Act Annex III)
// ============================================================================

export interface RiskInputs {
  // Prohibited uses (Article 5)
  biometricIdentification: boolean;
  socialScoring: boolean;
  manipulativeTechniques: boolean;
  exploitVulnerabilities: boolean;

  // High-risk systems (Annex III)
  criticalInfrastructure: boolean;        // Safety component in critical infra
  educationAccess: boolean;               // Determines access to education
  employmentDecisions: boolean;           // Recruitment, termination, task allocation
  essentialServicesAccess: boolean;       // Credit scoring, insurance, public benefits
  lawEnforcement: boolean;                // Law enforcement applications
  migrationAsylumBorder: boolean;         // Migration/asylum/border control
  justiceAdministration: boolean;         // Court decisions, evidence evaluation
  democraticProcesses: boolean;           // Influences voting or democratic processes

  // Volume thresholds
  decisionsPerYear: number;               // How many decisions does system make
  affectedIndividuals: number;            // How many people affected
}

export interface RiskOutputs {
  classification: 'prohibited' | 'high-risk' | 'limited-risk' | 'minimal-risk';
  triggeredCriteria: string[];
  complianceRequirements: string[];
  estimatedComplianceCost: {
    low: number;
    high: number;
  };
  estimatedTimeMonths: {
    low: number;
    high: number;
  };
  prohibitionReason?: string;
}

// ============================================================================
// Architecture Selection
// ============================================================================

export interface ArchitectureInputs {
  useCase: string;                        // Free text description
  volumeQueriesPerMonth: number;
  latencyRequirementMs: number;
  dataResidency: 'us' | 'eu' | 'any';
  budgetPerMonth: number;
  teamSkills: string[];                   // ['python', 'typescript', 'aws', etc.]
}

export interface ArchitectureRecommendation {
  name: string;
  description: string;
  components: {
    llm: { provider: string; model: string; costPer1M: number };
    vectorDb: { name: string; hosting: string; costPerMonth: number };
    orchestration: { framework: string; why: string };
    monitoring: { tools: string[]; costPerMonth: number };
  };
  totalEstimatedCost: number;
  pros: string[];
  cons: string[];
  complexity: 'low' | 'medium' | 'high';
  codeExample: string;
}

// ============================================================================
// Readiness Assessment
// ============================================================================

export interface ReadinessInputs {
  hasDataStrategy: boolean;
  hasMLExperience: boolean;
  hasInfrastructure: boolean;
  hasComplianceFramework: boolean;
  teamSize: number;
  timelineWeeks: number;
}

export interface ReadinessOutputs {
  score: number;  // 0-100
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  estimatedTimeToReady: number;  // weeks
}

// ============================================================================
// Complete Wizard State
// ============================================================================

export interface WizardState {
  currentStep: number;
  roi: {
    inputs: ROIInputs;
    outputs: ROIOutputs | null;
    completed: boolean;
  };
  risk: {
    inputs: RiskInputs;
    outputs: RiskOutputs | null;
    completed: boolean;
  };
  architecture: {
    inputs: ArchitectureInputs;
    recommendations: ArchitectureRecommendation[];
    selected: ArchitectureRecommendation | null;
    completed: boolean;
  };
  readiness: {
    inputs: ReadinessInputs;
    outputs: ReadinessOutputs | null;
    completed: boolean;
  };
  projectId: string | null;
  createdAt: string;
}
