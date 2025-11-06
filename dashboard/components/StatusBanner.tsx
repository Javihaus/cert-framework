'use client';

import { Box, Flex, Text, Icon } from '@chakra-ui/react';
import { MdCheckCircle, MdWarning } from 'react-icons/md';
import { colors } from '@/theme/colors';

interface StatusBannerProps {
  isCompliant: boolean;
  accuracy: number;
  failedCount: number;
}

export default function StatusBanner({ isCompliant, accuracy, failedCount }: StatusBannerProps) {
  const gradient = isCompliant ? colors.gradients.compliant : colors.gradients.warning;
  const IconComponent = isCompliant ? MdCheckCircle : MdWarning;
  const title = isCompliant ? 'Compliant' : 'Below Compliance Threshold';
  const message = isCompliant
    ? `Accuracy at ${(accuracy * 100).toFixed(1)}% exceeds the 90% regulatory threshold.`
    : `Accuracy at ${(accuracy * 100).toFixed(1)}% (target: 90%). Review ${failedCount} failed traces to identify systematic issues.`;

  return (
    <Box
      background={gradient}
      color="white"
      p="24px 28px"
      borderRadius="12px"
      mb="24px"
    >
      <Flex align="center" gap="20px">
        <Flex
          w="56px"
          h="56px"
          align="center"
          justify="center"
          bg="rgba(255, 255, 255, 0.2)"
          borderRadius="12px"
        >
          <Icon as={IconComponent} w="32px" h="32px" />
        </Flex>
        <Box flex="1">
          <Text fontSize="20px" fontWeight="700" mb="6px">
            {title}
          </Text>
          <Text fontSize="16px" opacity="0.95" lineHeight="1.5">
            {message}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
}
