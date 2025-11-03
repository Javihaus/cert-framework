'use client';

import { Box, Text } from '@chakra-ui/react';
import { colors } from '@/theme/colors';

interface HelpSectionProps {
  title: string;
  children: React.ReactNode;
}

function HelpSection({ title, children }: HelpSectionProps) {
  return (
    <Box mb="32px">
      <Text fontSize="16px" fontWeight="700" color={colors.navy} mb="12px">
        {title}
      </Text>
      {children}
    </Box>
  );
}

interface ExampleBoxProps {
  children: React.ReactNode;
}

function ExampleBox({ children }: ExampleBoxProps) {
  return (
    <Box
      bg={colors.patience}
      p="16px"
      borderRadius="8px"
      borderLeft="4px solid"
      borderLeftColor={colors.cobalt}
      my="12px"
    >
      {children}
    </Box>
  );
}

export default function DocumentationContent() {
  return (
    <Box>
      <Text fontSize="18px" fontWeight="700" color={colors.navy} mb="20px">
        Understanding CERT Metrics
      </Text>

      <HelpSection title="Accuracy vs. Confidence: What's the Difference?">
        <Text fontSize="14px" color={colors.text.muted} lineHeight="1.7" mb="12px">
          These two metrics measure different aspects of your AI system's performance, and understanding
          the distinction is critical for compliance.
        </Text>

        <ExampleBox>
          <Text fontSize="14px" color={colors.navy} mb="4px">
            <strong>Accuracy</strong>: Binary classification at a threshold. You're saying
            "above 0.70 = correct, below = incorrect." So 87.3% of your traces passed that threshold.
          </Text>
        </ExampleBox>

        <ExampleBox>
          <Text fontSize="14px" color={colors.navy} mb="4px">
            <strong>Mean Confidence</strong>: The average raw score across all predictions.
            This tells you how far above the line you are on average.
          </Text>
        </ExampleBox>

        <Text fontSize="14px" color={colors.text.muted} lineHeight="1.7">
          You could have 87% accuracy with mean confidence of 0.71 (barely passing) or 0.95
          (strongly passing). These are very different situations.
        </Text>
      </HelpSection>

      <HelpSection title="Which Metric Matters?">
        <Text fontSize="14px" color={colors.text.muted} lineHeight="1.7" mb="12px">
          Empirically, it depends on what happens when you're wrong.
        </Text>

        <Text fontSize="14px" color={colors.text.muted} lineHeight="1.7" mb="8px">
          <strong style={{ color: colors.navy }}>For compliance officers:</strong> If you need to know "are we meeting the regulatory
          threshold or not," <strong>accuracy</strong> is what matters. It's a hard boundary. Either
          you're compliant or you're not.
        </Text>

        <Text fontSize="14px" color={colors.text.muted} lineHeight="1.7">
          <strong style={{ color: colors.navy }}>For AI managers:</strong> If you want to know "are we trending toward trouble,"
          <strong> mean confidence</strong> is more useful. It gives you leading indicators. If mean
          confidence drops from 0.85 to 0.78, you're still compliant but something changed.
        </Text>
      </HelpSection>

      <HelpSection title="What About Failed Requests?">
        <Text fontSize="14px" color={colors.text.muted} lineHeight="1.7" mb="12px">
          The critical question: Are these random noise, or is there a systematic pattern?
        </Text>

        <Text fontSize="14px" color={colors.text.muted} lineHeight="1.7" mb="8px">
          <strong style={{ color: colors.navy }}>If systematic</strong> (like "all requests about X topic fail"): This is a bias
          problem, not just a performance problem. The EU AI Act cares about systematic failures
          much more than random errors.
        </Text>

        <Text fontSize="14px" color={colors.text.muted} lineHeight="1.7" mb="12px">
          <strong style={{ color: colors.navy }}>If random</strong>: High mean confidence suggests you're close to the
          boundary. Small improvements will push you over 90%.
        </Text>

        <Text fontSize="14px" color={colors.text.muted} lineHeight="1.7">
          Use the <strong>Distribution</strong> tab to analyze clustering. Use the
          <strong> Failed Traces</strong> tab to identify patterns.
        </Text>
      </HelpSection>

      <HelpSection title="The Compliance Threshold (90%)">
        <Text fontSize="14px" color={colors.text.muted} lineHeight="1.7" mb="12px">
          The 90% accuracy threshold is based on:
        </Text>

        <Box
          as="ul"
          ml="20px"
          fontSize="14px"
          color={colors.text.muted}
          lineHeight="1.8"
          mb="12px"
          css={{ listStyleType: 'disc' }}
        >
          <li>Industry standards for high-risk AI systems</li>
          <li>EU AI Act Article 15 requirements for "appropriate accuracy"</li>
          <li>Risk assessment showing acceptable error rate with human oversight</li>
          <li>Empirical validation on production data</li>
        </Box>

        <Text fontSize="14px" color={colors.text.muted} lineHeight="1.7">
          Below threshold doesn't mean the system is failing - it means you need to investigate
          failures to determine if they're systematic or random, then take corrective action.
        </Text>
      </HelpSection>

      <HelpSection title="What Actions Should I Take?">
        <Text fontSize="14px" color={colors.text.muted} lineHeight="1.7" mb="12px">
          Based on typical compliance scenarios:
        </Text>

        <Box
          as="ol"
          ml="20px"
          fontSize="14px"
          color={colors.text.muted}
          lineHeight="1.8"
          css={{ listStyleType: 'decimal' }}
        >
          <li>Review high-volume failure patterns (Incomplete, Missing Info) - fixable issues</li>
          <li>Analyze borderline cases near threshold - small fixes = big impact</li>
          <li>Export failed traces to CSV and share with engineering team</li>
          <li>Consider threshold calibration based on domain requirements</li>
          <li>Monitor daily/weekly trends to catch degradation early</li>
        </Box>
      </HelpSection>

      <Box
        bg={colors.background}
        border="2px solid"
        borderColor={colors.cobalt}
        p="16px"
        borderRadius="8px"
        mt="24px"
      >
        <Text fontSize="14px" fontWeight="600" color={colors.cobalt} mb="4px">
          💡 Article 19 Compliance
        </Text>
        <Text fontSize="13px" color={colors.text.muted} lineHeight="1.6">
          All traces shown in this dashboard are automatically logged per EU AI Act Article 19
          requirements, providing complete audit trail for regulatory review.
        </Text>
      </Box>
    </Box>
  );
}
