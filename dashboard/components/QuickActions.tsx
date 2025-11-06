'use client';

import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { MdSearch, MdFileDownload, MdBarChart } from 'react-icons/md';
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
      <Text fontSize="18px" fontWeight="700" color={colors.navy} mb="16px">
        Quick Actions
      </Text>
      <Flex gap="12px" flexWrap="wrap">
        <Button
          onClick={onViewFailed}
          bg={colors.cobalt}
          color="white"
          fontSize="15px"
          fontWeight="500"
          px="20px"
          py="12px"
          h="auto"
          borderRadius="8px"
          _hover={{ bg: colors.navy }}
          transition="all 0.2s"
        >
          <Flex align="center" gap="8px">
            <MdSearch size={18} />
            <span>Investigate Failed Traces</span>
          </Flex>
        </Button>
        <Button
          onClick={onExport}
          bg="white"
          color={colors.navy}
          fontSize="15px"
          fontWeight="500"
          px="20px"
          py="12px"
          h="auto"
          border="1px solid"
          borderColor={colors.patience}
          borderRadius="8px"
          _hover={{ bg: colors.background }}
          transition="all 0.2s"
        >
          <Flex align="center" gap="8px">
            <MdFileDownload size={18} />
            <span>Export to CSV</span>
          </Flex>
        </Button>
        <Button
          onClick={onViewDistribution}
          bg="white"
          color={colors.navy}
          fontSize="15px"
          fontWeight="500"
          px="20px"
          py="12px"
          h="auto"
          border="1px solid"
          borderColor={colors.patience}
          borderRadius="8px"
          _hover={{ bg: colors.background }}
          transition="all 0.2s"
        >
          <Flex align="center" gap="8px">
            <MdBarChart size={18} />
            <span>View Distribution</span>
          </Flex>
        </Button>
      </Flex>
    </Box>
  );
}
