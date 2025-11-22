'use client';

import { useState } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { CheckCircle2, AlertTriangle, XCircle, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  question: string;
  category: 'risk' | 'readiness';
  options: Array<{ value: string; label: string; score: number }>;
  dimension?: string;
}

interface AssessmentReport {
  riskLevel: 'PROHIBITED' | 'HIGH_RISK' | 'LIMITED_RISK' | 'MINIMAL_RISK';
  riskScore: number;
  readinessScore: number;
  requirements: string[];
  estimatedCost: string;
  estimatedTimeline: string;
  nextSteps: string[];
  strengths: string[];
  gaps: string[];
}

const ANNEX_III_QUESTIONS: Question[] = [
  {
    id: 'biometric',
    question: 'Does your system use biometric categorization or identification?',
    category: 'risk',
    options: [
      { value: 'yes', label: 'Yes', score: 100 },
      { value: 'no', label: 'No', score: 0 },
    ],
  },
  {
    id: 'critical_infrastructure',
    question: 'Is the system deployed in critical infrastructure (energy, water, transport)?',
    category: 'risk',
    options: [
      { value: 'yes', label: 'Yes', score: 80 },
      { value: 'no', label: 'No', score: 0 },
    ],
  },
  {
    id: 'education_employment',
    question: 'Does the system evaluate individuals for education or employment decisions?',
    category: 'risk',
    options: [
      { value: 'yes', label: 'Yes', score: 70 },
      { value: 'limited', label: 'Limited use', score: 30 },
      { value: 'no', label: 'No', score: 0 },
    ],
  },
  {
    id: 'law_enforcement',
    question: 'Is the system used for law enforcement or border control?',
    category: 'risk',
    options: [
      { value: 'yes', label: 'Yes', score: 100 },
      { value: 'no', label: 'No', score: 0 },
    ],
  },
  {
    id: 'public_services',
    question: 'Does the system assist in decisions about access to public services or benefits?',
    category: 'risk',
    options: [
      { value: 'yes', label: 'Yes, determines access', score: 80 },
      { value: 'assists', label: 'Assists human decisions', score: 40 },
      { value: 'no', label: 'No', score: 0 },
    ],
  },
];

const READINESS_QUESTIONS: Question[] = [
  {
    id: 'data_governance',
    question: 'How mature is your data governance and quality management?',
    category: 'readiness',
    dimension: 'data_governance',
    options: [
      { value: 'advanced', label: 'Advanced - Comprehensive policies and monitoring', score: 100 },
      { value: 'developing', label: 'Developing - Basic processes in place', score: 60 },
      { value: 'limited', label: 'Limited - Ad-hoc approaches', score: 30 },
      { value: 'none', label: 'None - No formal processes', score: 0 },
    ],
  },
  {
    id: 'technical_documentation',
    question: 'Do you maintain technical documentation for your AI systems?',
    category: 'readiness',
    dimension: 'documentation',
    options: [
      { value: 'comprehensive', label: 'Comprehensive - All systems documented', score: 100 },
      { value: 'partial', label: 'Partial - Key systems documented', score: 60 },
      { value: 'limited', label: 'Limited - Sparse documentation', score: 30 },
      { value: 'none', label: 'None', score: 0 },
    ],
  },
  {
    id: 'risk_management',
    question: 'Do you have AI risk management processes in place?',
    category: 'readiness',
    dimension: 'risk_management',
    options: [
      { value: 'formal', label: 'Formal framework with regular reviews', score: 100 },
      { value: 'informal', label: 'Informal processes', score: 50 },
      { value: 'none', label: 'No risk management', score: 0 },
    ],
  },
  {
    id: 'human_oversight',
    question: 'What level of human oversight is built into your systems?',
    category: 'readiness',
    dimension: 'human_oversight',
    options: [
      { value: 'continuous', label: 'Continuous human-in-the-loop', score: 100 },
      { value: 'periodic', label: 'Periodic human review', score: 60 },
      { value: 'minimal', label: 'Minimal oversight', score: 20 },
      { value: 'none', label: 'Fully automated', score: 0 },
    ],
  },
  {
    id: 'testing_validation',
    question: 'How do you test and validate AI system outputs?',
    category: 'readiness',
    dimension: 'testing_validation',
    options: [
      { value: 'comprehensive', label: 'Comprehensive testing framework', score: 100 },
      { value: 'basic', label: 'Basic testing procedures', score: 60 },
      { value: 'adhoc', label: 'Ad-hoc validation', score: 30 },
      { value: 'none', label: 'No formal testing', score: 0 },
    ],
  },
];

const ALL_QUESTIONS = [...ANNEX_III_QUESTIONS, ...READINESS_QUESTIONS];

const riskLevelConfig = {
  PROHIBITED: { color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-500/20', borderColor: 'border-red-500', icon: XCircle, label: 'Prohibited' },
  HIGH_RISK: { color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-500/20', borderColor: 'border-amber-500', icon: AlertTriangle, label: 'High Risk' },
  LIMITED_RISK: { color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-500/20', borderColor: 'border-blue-500', icon: CheckCircle2, label: 'Limited Risk' },
  MINIMAL_RISK: { color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-500/20', borderColor: 'border-emerald-500', icon: CheckCircle2, label: 'Minimal Risk' },
};

export default function AssessmentPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const [email, setEmail] = useState('');

  const handleAnswer = (answer: string) => {
    const newAnswers = { ...answers, [ALL_QUESTIONS[currentQuestion].id]: answer };
    setAnswers(newAnswers);

    if (currentQuestion < ALL_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      generateReport(newAnswers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateRiskScore = (answers: Record<string, string>): number => {
    let score = 0;
    ANNEX_III_QUESTIONS.forEach((q) => {
      const answer = answers[q.id];
      if (answer) {
        const option = q.options.find((opt) => opt.value === answer);
        score += option?.score || 0;
      }
    });
    return score;
  };

  const classifyRisk = (score: number): AssessmentReport['riskLevel'] => {
    if (score >= 90) return 'PROHIBITED';
    if (score >= 60) return 'HIGH_RISK';
    if (score >= 30) return 'LIMITED_RISK';
    return 'MINIMAL_RISK';
  };

  const generateReport = (answers: Record<string, string>) => {
    const riskScore = calculateRiskScore(answers);
    const riskLevel = classifyRisk(riskScore);

    let readinessScore = 0;
    let readinessCount = 0;
    READINESS_QUESTIONS.forEach((q) => {
      const answer = answers[q.id];
      if (answer) {
        const option = q.options.find((opt) => opt.value === answer);
        readinessScore += option?.score || 0;
        readinessCount++;
      }
    });
    readinessScore = readinessCount > 0 ? readinessScore / readinessCount : 0;

    const requirements = getRequirements(riskLevel);
    const estimatedCost = estimateCost(riskLevel, readinessScore);
    const estimatedTimeline = estimateTimeline(riskLevel, readinessScore);
    const nextSteps = getNextSteps(riskLevel, readinessScore);
    const strengths = getStrengths(answers);
    const gaps = getGaps(answers);

    setReport({
      riskLevel,
      riskScore,
      readinessScore,
      requirements,
      estimatedCost,
      estimatedTimeline,
      nextSteps,
      strengths,
      gaps,
    });
  };

  const getRequirements = (riskLevel: string): string[] => {
    const common = ['Technical documentation', 'Record keeping', 'Transparency requirements'];
    if (riskLevel === 'PROHIBITED') return ['System cannot be deployed under EU AI Act'];
    if (riskLevel === 'HIGH_RISK') return [...common, 'Conformity assessment', 'Risk management system', 'Data governance', 'Human oversight', 'Accuracy requirements', 'Cybersecurity measures'];
    if (riskLevel === 'LIMITED_RISK') return [...common, 'User disclosure requirements'];
    return ['Basic transparency requirements'];
  };

  const estimateCost = (riskLevel: string, readiness: number): string => {
    if (riskLevel === 'HIGH_RISK') return readiness >= 70 ? '$50,000 - $100,000' : '$100,000 - $250,000';
    if (riskLevel === 'LIMITED_RISK') return '$10,000 - $50,000';
    return '$5,000 - $20,000';
  };

  const estimateTimeline = (riskLevel: string, readiness: number): string => {
    if (riskLevel === 'HIGH_RISK') return readiness >= 70 ? '4-6 months' : '9-12 months';
    if (riskLevel === 'LIMITED_RISK') return '2-3 months';
    return '1-2 months';
  };

  const getNextSteps = (riskLevel: string, readiness: number): string[] => {
    const steps = ['Review full EU AI Act requirements', 'Audit existing documentation'];
    if (readiness < 50) steps.push('Establish data governance framework', 'Implement testing procedures');
    if (riskLevel === 'HIGH_RISK') steps.push('Engage compliance consultant', 'Plan conformity assessment');
    steps.push('Contact CERT team for implementation support');
    return steps;
  };

  const getStrengths = (answers: Record<string, string>): string[] => {
    const strengths = [];
    if (answers.data_governance === 'advanced') strengths.push('Strong data governance');
    if (answers.technical_documentation === 'comprehensive') strengths.push('Comprehensive documentation');
    if (answers.human_oversight === 'continuous') strengths.push('Robust human oversight');
    return strengths;
  };

  const getGaps = (answers: Record<string, string>): string[] => {
    const gaps = [];
    if (!answers.data_governance || answers.data_governance === 'none') gaps.push('Data governance needs development');
    if (!answers.technical_documentation || answers.technical_documentation === 'none') gaps.push('Technical documentation required');
    if (!answers.risk_management || answers.risk_management === 'none') gaps.push('Risk management framework needed');
    return gaps;
  };

  // Results view
  if (report) {
    const config = riskLevelConfig[report.riskLevel];
    const Icon = config.icon;

    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          {/* Header */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <Icon size={64} className={config.color} />
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
              Assessment Complete
            </h1>
            <div className={cn(
              'px-6 py-2 rounded-full border-2',
              config.bgColor,
              config.borderColor
            )}>
              <span className={cn('text-xl font-bold', config.color)}>
                {config.label}
              </span>
            </div>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Risk Score</p>
              <p className={cn('text-3xl font-bold', config.color)}>{report.riskScore}</p>
            </div>
            <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Readiness Score</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {report.readinessScore.toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Requirements */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-3">
              Compliance Requirements
            </h2>
            <div className="space-y-2">
              {report.requirements.map((req, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">{req}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Estimates */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Estimated Cost</p>
              <p className="text-xl font-semibold text-zinc-900 dark:text-white">{report.estimatedCost}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Estimated Timeline</p>
              <p className="text-xl font-semibold text-zinc-900 dark:text-white">{report.estimatedTimeline}</p>
            </div>
          </div>

          {/* Next steps */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-3">
              Recommended Next Steps
            </h2>
            <div className="space-y-2">
              {report.nextSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-lg text-blue-600 font-medium">{i + 1}.</span>
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Email capture */}
          <div className="bg-zinc-50 dark:bg-zinc-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
              Get Your Full Report
            </h3>
            <div>
              <label className="text-sm font-medium text-zinc-900 dark:text-white mb-1 block">
                Email Address
              </label>
              <div className="flex gap-3">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input flex-1"
                />
                <Button
                  onClick={() => alert('Report will be sent to: ' + email)}
                  icon={<Download size={16} />}
                >
                  Download Report
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Question view
  const question = ALL_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / ALL_QUESTIONS.length) * 100;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Question {currentQuestion + 1} of {ALL_QUESTIONS.length}
          </span>
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
            {progress.toFixed(0)}% Complete
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill brand"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <Card>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-6">
          {question.question}
        </h2>

        <div className="space-y-3">
          {question.options.map((option) => (
            <div
              key={option.value}
              onClick={() => handleAnswer(option.value)}
              className={cn(
                'p-4 border-2 rounded-lg cursor-pointer transition-all',
                answers[question.id] === option.value
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-blue-400'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                  answers[question.id] === option.value
                    ? 'border-blue-600'
                    : 'border-zinc-300 dark:border-zinc-600'
                )}>
                  {answers[question.id] === option.value && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  )}
                </div>
                <span className="text-base text-zinc-700 dark:text-zinc-300">{option.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="secondary"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            icon={<ChevronLeft size={16} />}
          >
            Previous
          </Button>

          {currentQuestion === ALL_QUESTIONS.length - 1 && answers[question.id] && (
            <Button
              onClick={() => generateReport(answers)}
              icon={<ChevronRight size={16} />}
              iconPosition="right"
            >
              View Results
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
