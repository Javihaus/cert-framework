'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { colors } from '@/theme/colors';

interface StatusBannerProps {
  isCompliant: boolean;
  accuracy: number;
  failedCount: number;
}

export default function StatusBanner({ isCompliant, accuracy, failedCount }: StatusBannerProps) {
  const gradient = isCompliant ? colors.gradients.compliant : colors.gradients.warning;
  const icon = isCompliant ? '✓' : '⚠';
  const title = isCompliant ? 'Compliant' : 'Below Compliance Threshold';
  const message = isCompliant
    ? `Accuracy at ${(accuracy * 100).toFixed(1)}% exceeds the 90% regulatory threshold.`
    : `Accuracy at ${(accuracy * 100).toFixed(1)}% (target: 90%). Review ${failedCount} failed traces to identify systematic issues.`;

  return (
    <Box
      background={gradient}
      color="white"
      p="20px 24px"
      borderRadius="12px"
      mb="24px"
    >
      <Flex align="center" gap="16px">
        <Flex
          w="48px"
          h="48px"
          align="center"
          justify="center"
          bg="rgba(255, 255, 255, 0.2)"
          borderRadius="50%"
          fontSize="24px"
          fontWeight="700"
        >
          {icon}
        </Flex>
        <Box flex="1">
          <Text fontSize="18px" fontWeight="600" mb="4px">
            {title}
          </Text>
          <Text fontSize="14px" opacity="0.95">
            {message}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
}
