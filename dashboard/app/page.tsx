'use client';

import Link from 'next/link';
import { Box, Flex, Text, Grid } from '@chakra-ui/react';
import Card from '@/components/Card';
import { colors, spacing, typography } from '@/theme';
import {
  Zap,
  DollarSign,
  TrendingDown,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  Wand2,
} from 'lucide-react';

interface WorkflowCard {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  features: string[];
}

const WORKFLOWS: WorkflowCard[] = [
  {
    title: 'AI Implementation Wizard',
    description: 'Step-by-step guided planning for production AI systems',
    href: '/wizard',
    icon: <Wand2 size={32} />,
    color: colors.cobalt,
    features: [
      'ROI calculator',
      'EU AI Act risk assessment',
      'Architecture recommendations',
      'Deployment roadmap',
    ],
  },
  {
    title: 'Connectors',
    description: 'Automatic tracing for OpenAI, Anthropic, LangChain, and AWS Bedrock',
    href: '/connectors',
    icon: <Zap size={32} />,
    color: colors.olive,
    features: [
      'Zero-code instrumentation',
      'Automatic cost tracking',
      'Multi-platform support',
      'Real-time logging',
    ],
  },
  {
    title: 'Cost Analysis',
    description: 'Track spending, analyze trends, and optimize model selection',
    href: '/costs',
    icon: <DollarSign size={32} />,
    color: colors.olive,
    features: [
      'Daily cost breakdowns',
      'Model-level analysis',
      'Monthly projections',
      'Platform comparisons',
    ],
  },
  {
    title: 'Optimization',
    description: 'Find savings through model downgrades, caching, and prompt optimization',
    href: '/optimization',
    icon: <TrendingDown size={32} />,
    color: colors.gold,
    features: [
      'Automated recommendations',
      'Impact analysis',
      'Savings projections',
      'Implementation guides',
    ],
  },
  {
    title: 'EU AI Act Assessment',
    description: 'Interactive questionnaire to assess your AI system risk classification',
    href: '/assessment',
    icon: <FileCheck size={32} />,
    color: colors.coral,
    features: [
      'Risk classification',
      'Compliance requirements',
      'Cost estimation',
      'Implementation roadmap',
    ],
  },
];

export default function HomePage() {
  return (
    <Box p={spacing.xl}>
      {/* Hero Section */}
      <Box mb={spacing.xl}>
        <Flex align="center" gap={spacing.md} mb={spacing.md}>
          <ShieldCheck size={48} color={colors.cobalt} />
          <Box>
            <Text fontSize={typography.fontSize['4xl']} fontWeight={typography.fontWeight.bold} color={colors.navy} lineHeight="1.2">
              CERT Framework
            </Text>
            <Text fontSize={typography.fontSize.xl} color={colors.text.secondary}>
              Production AI Implementation Pipeline
            </Text>
          </Box>
        </Flex>
        <Text fontSize={typography.fontSize.lg} color={colors.text.secondary} maxW="800px">
          Transform your AI applications from prototype to production with automated tracing, cost optimization,
          and regulatory compliance. Start logging every API call with a single line of code.
        </Text>
      </Box>

      {/* Quick Start */}
      <Card mb={spacing.xl} bg={colors.cobalt + '10'} borderColor={colors.cobalt}>
        <Flex align="center" gap={spacing.md} mb={spacing.md}>
          <Zap size={24} color={colors.cobalt} />
          <Text fontSize={typography.fontSize.xl} fontWeight={typography.fontWeight.semibold} color={colors.navy}>
            Quick Start
          </Text>
        </Flex>
        <Grid templateColumns="repeat(3, 1fr)" gap={spacing.lg}>
          <Box>
            <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.xs}>
              1. Install
            </Text>
            <Box bg="white" p={spacing.sm} borderRadius="md" fontFamily="mono" fontSize={typography.fontSize.xs}>
              pip install cert-framework[integrations]
            </Box>
          </Box>
          <Box>
            <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.xs}>
              2. Import
            </Text>
            <Box bg="white" p={spacing.sm} borderRadius="md" fontFamily="mono" fontSize={typography.fontSize.xs}>
              from cert.integrations.auto import *
            </Box>
          </Box>
          <Box>
            <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.xs}>
              3. Run
            </Text>
            <Box bg="white" p={spacing.sm} borderRadius="md" fontFamily="mono" fontSize={typography.fontSize.xs}>
              # All AI calls now traced!
            </Box>
          </Box>
        </Grid>
      </Card>

      {/* Workflows Grid */}
      <Box mb={spacing.xl}>
        <Text fontSize={typography.fontSize['2xl']} fontWeight={typography.fontWeight.bold} color={colors.navy} mb={spacing.md}>
          Workflows
        </Text>
        <Grid templateColumns="repeat(2, 1fr)" gap={spacing.lg}>
          {WORKFLOWS.map((workflow) => (
            <Link key={workflow.href} href={workflow.href} style={{ textDecoration: 'none' }}>
              <Card
                _hover={{
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                }}
                transition="all 0.2s"
                cursor="pointer"
                borderLeft="4px solid"
                borderColor={workflow.color}
                h="100%"
              >
                <Flex direction="column" h="100%">
                  <Flex align="center" gap={spacing.md} mb={spacing.md}>
                    <Box color={workflow.color}>{workflow.icon}</Box>
                    <Text fontSize={typography.fontSize['2xl']} fontWeight={typography.fontWeight.bold} color={colors.navy}>
                      {workflow.title}
                    </Text>
                  </Flex>

                  <Text fontSize={typography.fontSize.sm} color={colors.text.secondary} mb={spacing.md}>
                    {workflow.description}
                  </Text>

                  <Box flex={1}>
                    <Flex direction="column" gap={spacing.xs}>
                      {workflow.features.map((feature, idx) => (
                        <Flex key={idx} align="center" gap={spacing.xs}>
                          <Box w="4px" h="4px" bg={workflow.color} borderRadius="full" />
                          <Text fontSize={typography.fontSize.xs} color={colors.text.secondary}>
                            {feature}
                          </Text>
                        </Flex>
                      ))}
                    </Flex>
                  </Box>

                  <Flex align="center" gap={spacing.xs} mt={spacing.md} color={workflow.color}>
                    <Text fontSize={typography.fontSize.sm} fontWeight={typography.fontWeight.medium}>
                      Explore
                    </Text>
                    <ArrowRight size={16} />
                  </Flex>
                </Flex>
              </Card>
            </Link>
          ))}
        </Grid>
      </Box>

      {/* Features */}
      <Box>
        <Text fontSize={typography.fontSize['2xl']} fontWeight={typography.fontWeight.bold} color={colors.navy} mb={spacing.md}>
          Why CERT Framework?
        </Text>
        <Grid templateColumns="repeat(3, 1fr)" gap={spacing.md}>
          <Card>
            <Text fontSize={typography.fontSize.lg} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.xs}>
              Zero-Code Tracing
            </Text>
            <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
              One import, automatic instrumentation. Works with OpenAI, Anthropic, LangChain, and Bedrock out of the box.
            </Text>
          </Card>
          <Card>
            <Text fontSize={typography.fontSize.lg} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.xs}>
              Client-Side Analysis
            </Text>
            <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
              Upload your trace files and analyze costs, find optimizations, and generate compliance docs entirely in your browser.
            </Text>
          </Card>
          <Card>
            <Text fontSize={typography.fontSize.lg} fontWeight={typography.fontWeight.semibold} color={colors.navy} mb={spacing.xs}>
              Production Ready
            </Text>
            <Text fontSize={typography.fontSize.sm} color={colors.text.secondary}>
              Circuit breakers, silent failures, and zero performance impact. Designed for production workloads from day one.
            </Text>
          </Card>
        </Grid>
      </Box>
    </Box>
  );
}
