'use client';

import { Box, Flex, Text, Icon } from '@chakra-ui/react';
import { MdCheckCircle, MdInfo } from 'react-icons/md';
import { colors, spacing, typography, borderRadius } from '@/theme';

interface StatusBannerProps {
  isCompliant: boolean;
  accuracy: number;
  failedCount: number;
}

export default function StatusBanner({ isCompliant, accuracy, failedCount }: StatusBannerProps) {
  const gradient = isCompliant ? colors.gradients.compliant : colors.gradients.warning;
  const IconComponent = isCompliant ? MdCheckCircle : MdInfo;
  const title = isCompliant ? 'Compliant' : 'Below Compliance Threshold';
  const message = isCompliant
    ? `Accuracy at ${(accuracy * 100).toFixed(1)}% exceeds the 90% regulatory threshold.`
    : `Accuracy at ${(accuracy * 100).toFixed(1)}% (target: 90%). Review ${failedCount} failed traces to identify systematic issues.`;

  return (
    <Box
      background={gradient}
      color="white"
      p={`${spacing.lg} 28px`}
      borderRadius={borderRadius.lg}
      mb={spacing.lg}
    >
      <Flex align="center" gap={spacing.lg}>
        <Flex
          w="56px"
          h="56px"
          align="center"
          justify="center"
          bg="rgba(255, 255, 255, 0.2)"
          borderRadius={borderRadius.lg}
        >
          <Icon as={IconComponent} w="32px" h="32px" />
        </Flex>
        <Box flex="1">
          <Text
            fontSize={typography.fontSize.xl}
            fontWeight={typography.fontWeight.bold}
            mb={spacing.xs}
          >
            {title}
          </Text>
          <Text
            fontSize={typography.fontSize.base}
            opacity="0.95"
            lineHeight={typography.lineHeight.normal}
          >
            {message}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
}
