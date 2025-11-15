'use client';

import { useState } from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  Progress,
  Radio,
  RadioGroup,
  Stack,
  Input,
  FormControl,
  FormLabel,
  Grid,
  List,
  ListItem,
} from '@chakra-ui/react';
import Card from '@/components/Card';
import { colors, spacing, typography } from '@/theme';
import { CheckCircle2, AlertTriangle, XCircle, ChevronLeft, ChevronRight, Download } from 'lucide-react';

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
    // Calculate risk score
    const riskScore = calculateRiskScore(answers);
    const riskLevel = classifyRisk(riskScore);

    // Calculate readiness score
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

    // Determine requirements
    const requirements = getRequirements(riskLevel);
    const estimatedCost = estimateCost(riskLevel, readinessScore);
    const estimatedTimeline = estimateTimeline(riskLevel, readinessScore);
    const nextSteps = getNextSteps(riskLevel, readinessScore);
    const strengths = getStrengths(answers);
    const gaps = getGaps(answers);

    const report: AssessmentReport = {
      riskLevel,
      riskScore,
      readinessScore,
      requirements,
      estimatedCost,
      estimatedTimeline,
      nextSteps,
      strengths,
      gaps,
    };

    setReport(report);
  };

  const getRequirements = (riskLevel: string): string[] => {
    const common = ['Technical documentation', 'Record keeping', 'Transparency requirements'];

    if (riskLevel === 'PROHIBITED') {
      return ['System cannot be deployed under EU AI Act'];
    }
    if (riskLevel === 'HIGH_RISK') {
      return [...common, 'Conformity assessment', 'Risk management system', 'Data governance', 'Human oversight', 'Accuracy requirements', 'Cybersecurity measures'];
    }
    if (riskLevel === 'LIMITED_RISK') {
      return [...common, 'User disclosure requirements'];
    }
    return ['Basic transparency requirements'];
  };

  const estimateCost = (riskLevel: string, readiness: number): string => {
    if (riskLevel === 'HIGH_RISK') {
      return readiness >= 70 ? '$50,000 - $100,000' : '$100,000 - $250,000';
    }
    if (riskLevel === 'LIMITED_RISK') {
      return '$10,000 - $50,000';
    }
    return '$5,000 - $20,000';
  };

  const estimateTimeline = (riskLevel: string, readiness: number): string => {
    if (riskLevel === 'HIGH_RISK') {
      return readiness >= 70 ? '4-6 months' : '9-12 months';
    }
    if (riskLevel === 'LIMITED_RISK') {
      return '2-3 months';
    }
    return '1-2 months';
  };

  const getNextSteps = (riskLevel: string, readiness: number): string[] => {
    const steps = ['Review full EU AI Act requirements', 'Audit existing documentation'];

    if (readiness < 50) {
      steps.push('Establish data governance framework', 'Implement testing procedures');
    }
    if (riskLevel === 'HIGH_RISK') {
      steps.push('Engage compliance consultant', 'Plan conformity assessment');
    }
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

  const riskLevelConfig = {
    PROHIBITED: { color: colors.alert, icon: XCircle, label: 'Prohibited' },
    HIGH_RISK: { color: colors.gold, icon: AlertTriangle, label: 'High Risk' },
    LIMITED_RISK: { color: colors.cobalt, icon: CheckCircle2, label: 'Limited Risk' },
    MINIMAL_RISK: { color: colors.olive, icon: CheckCircle2, label: 'Minimal Risk' },
  };

  if (report) {
    const config = riskLevelConfig[report.riskLevel];
    const Icon = config.icon;

    return (
      <Box maxW="1000px" mx="auto" p={spacing.xl}>
        <Card>
          {/* Header */}
          <Flex direction="column" align="center" gap={spacing.md} mb={spacing.xl}>
            <Icon size={64} color={config.color} />
            <Text
              fontSize={typography.fontSize['3xl']}
              fontWeight={typography.fontWeight.bold}
              color={colors.navy}
            >
              Assessment Complete
            </Text>
            <Box
              px={spacing.lg}
              py={spacing.sm}
              bg={config.color + '20'}
              borderRadius="full"
              border="2px solid"
              borderColor={config.color}
            >
              <Text
                fontSize={typography.fontSize.xl}
                fontWeight={typography.fontWeight.bold}
                color={config.color}
              >
                {config.label}
              </Text>
            </Box>
          </Flex>

          {/* Scores */}
          <Grid templateColumns="repeat(2, 1fr)" gap={spacing.lg} mb={spacing.xl}>
            <Box textAlign="center" p={spacing.md} bg={colors.background} borderRadius="md">
              <Text fontSize={typography.fontSize.sm} color={colors.text.secondary} mb={spacing.xs}>
                Risk Score
              </Text>
              <Text fontSize={typography.fontSize['3xl']} fontWeight={typography.fontWeight.bold} color={config.color}>
                {report.riskScore}
              </Text>
            </Box>
            <Box textAlign="center" p={spacing.md} bg={colors.background} borderRadius="md">
              <Text fontSize={typography.fontSize.sm} color={colors.text.secondary} mb={spacing.xs}>
                Readiness Score
              </Text>
              <Text fontSize={typography.fontSize['3xl']} fontWeight={typography.fontWeight.bold} color={colors.cobalt}>
                {report.readinessScore.toFixed(0)}%
              </Text>
            </Box>
          </Grid>

          {/* Requirements */}
          <Box mb={spacing.lg}>
            <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.sm}>
              Compliance Requirements
            </Text>
            <List spacing={spacing.xs}>
              {report.requirements.map((req, i) => (
                <ListItem key={i}>
                  <Flex align="center" gap={spacing.xs}>
                    <CheckCircle2 size={16} color={colors.cobalt} />
                    <Text fontSize={typography.fontSize.sm}>{req}</Text>
                  </Flex>
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Estimates */}
          <Grid templateColumns="repeat(2, 1fr)" gap={spacing.lg} mb={spacing.lg}>
            <Box>
              <Text fontSize={typography.fontSize.sm} color={colors.text.secondary} mb={spacing.xs}>
                Estimated Cost
              </Text>
              <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.semibold} color={colors.navy}>
                {report.estimatedCost}
              </Text>
            </Box>
            <Box>
              <Text fontSize={typography.fontSize.sm} color={colors.text.secondary} mb={spacing.xs}>
                Estimated Timeline
              </Text>
              <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.semibold} color={colors.navy}>
                {report.estimatedTimeline}
              </Text>
            </Box>
          </Grid>

          {/* Next steps */}
          <Box mb={spacing.lg}>
            <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.sm}>
              Recommended Next Steps
            </Text>
            <List spacing={spacing.xs}>
              {report.nextSteps.map((step, i) => (
                <ListItem key={i}>
                  <Flex align="center" gap={spacing.xs}>
                    <Text fontSize={typography.fontSize.lg} color={colors.cobalt}>{i + 1}.</Text>
                    <Text fontSize={typography.fontSize.sm}>{step}</Text>
                  </Flex>
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Email capture */}
          <Box bg={colors.background} p={spacing.lg} borderRadius="md">
            <Text fontSize={typography.fontSize.lg} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.sm}>
              Get Your Full Report
            </Text>
            <FormControl>
              <FormLabel fontSize={typography.fontSize.sm}>Email Address</FormLabel>
              <Flex gap={spacing.sm}>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button
                  leftIcon={<Download size={16} />}
                  bg={colors.cobalt}
                  color="white"
                  _hover={{ bg: colors.navy }}
                  onClick={() => {
                    // TODO: Send report via API
                    alert('Report will be sent to: ' + email);
                  }}
                >
                  Download Report
                </Button>
              </Flex>
            </FormControl>
          </Box>
        </Card>
      </Box>
    );
  }

  const question = ALL_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / ALL_QUESTIONS.length) * 100;

  return (
    <Box maxW="800px" mx="auto" p={spacing.xl}>
      {/* Progress */}
      <Box mb={spacing.xl}>
        <Flex justify="space-between" mb={spacing.sm}>
          <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
            Question {currentQuestion + 1} of {ALL_QUESTIONS.length}
          </Text>
          <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.medium} color={colors.cobalt}>
            {progress.toFixed(0)}% Complete
          </Text>
        </Flex>
        <Progress value={progress} colorScheme="blue" borderRadius="full" />
      </Box>

      {/* Question card */}
      <Card>
        <Text
          fontSize={typography.fontSize['2xl']}
          fontWeight={typography.fontWeight.semibold}
          color={colors.navy}
          mb={spacing.lg}
        >
          {question.question}
        </Text>

        <RadioGroup
          value={answers[question.id] || ''}
          onChange={handleAnswer}
        >
          <Stack spacing={spacing.sm}>
            {question.options.map((option) => (
              <Box
                key={option.value}
                p={spacing.md}
                border="2px solid"
                borderColor={answers[question.id] === option.value ? colors.cobalt : colors.patience}
                borderRadius="md"
                bg={answers[question.id] === option.value ? colors.cobalt + '10' : 'transparent'}
                cursor="pointer"
                transition="all 0.2s"
                _hover={{ borderColor: colors.cobalt }}
                onClick={() => handleAnswer(option.value)}
              >
                <Radio value={option.value} colorScheme="blue">
                  <Text fontSize={typography.fontSize.base}>{option.label}</Text>
                </Radio>
              </Box>
            ))}
          </Stack>
        </RadioGroup>

        {/* Navigation */}
        <Flex justify="space-between" mt={spacing.xl}>
          <Button
            leftIcon={<ChevronLeft size={16} />}
            onClick={handlePrevious}
            isDisabled={currentQuestion === 0}
            variant="outline"
          >
            Previous
          </Button>

          {currentQuestion === ALL_QUESTIONS.length - 1 && answers[question.id] && (
            <Button
              rightIcon={<ChevronRight size={16} />}
              onClick={() => generateReport(answers)}
              bg={colors.cobalt}
              color="white"
              _hover={{ bg: colors.navy }}
            >
              View Results
            </Button>
          )}
        </Flex>
      </Card>
    </Box>
  );
}
