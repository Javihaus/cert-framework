'use client';

import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { colors } from '@/theme/colors';

interface QuickActionsProps {
  onViewFailed: () => void;
  onViewDistribution: () => void;
  onExport: () => void;
}

export default function QuickActions({ onViewFailed, onViewDistribution, onExport }: QuickActionsProps) {
  return (
    <Box
      bg="white"
      p="24px"
      borderRadius="12px"
      border="1px solid"
      borderColor={colors.patience}
    >
      <Text fontSize="16px" fontWeight="700" color={colors.navy} mb="16px">
        Quick Actions
      </Text>
      <Flex gap="12px" flexWrap="wrap">
        <Button
          onClick={onViewFailed}
          bg={colors.cobalt}
          color="white"
          fontSize="14px"
          fontWeight="500"
          px="18px"
          py="10px"
          h="auto"
          borderRadius="8px"
          _hover={{ bg: colors.navy }}
          transition="all 0.2s"
        >
          ▶ Investigate Failed Traces
        </Button>
        <Button
          onClick={onExport}
          bg="white"
          color={colors.navy}
          fontSize="14px"
          fontWeight="500"
          px="18px"
          py="10px"
          h="auto"
          border="1px solid"
          borderColor={colors.patience}
          borderRadius="8px"
          _hover={{ bg: colors.background }}
          transition="all 0.2s"
        >
          ↓ Export to CSV
        </Button>
        <Button
          onClick={onViewDistribution}
          bg="white"
          color={colors.navy}
          fontSize="14px"
          fontWeight="500"
          px="18px"
          py="10px"
          h="auto"
          border="1px solid"
          borderColor={colors.patience}
          borderRadius="8px"
          _hover={{ bg: colors.background }}
          transition="all 0.2s"
        >
          📊 View Distribution
        </Button>
      </Flex>
    </Box>
  );
}
