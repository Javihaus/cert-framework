'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { colors } from '@/theme/colors';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'failed', label: 'Failed Traces' },
    { id: 'distribution', label: 'Distribution' },
    { id: 'documentation', label: 'Documentation' },
  ];

  return (
    <Box
      position="sticky"
      top="0"
      zIndex="100"
      bg="white"
      borderBottom="1px solid"
      borderColor={colors.patience}
      boxShadow="sm"
    >
      <Flex
        maxW="1600px"
        mx="auto"
        px="32px"
        h="64px"
        align="center"
      >
        <Text
          fontSize="20px"
          fontWeight="700"
          color={colors.cobalt}
          letterSpacing="-0.5px"
        >
          CERT Dashboard
        </Text>

        <Flex ml="48px" gap="4px">
          {tabs.map((tab) => (
            <Box
              key={tab.id}
              as="button"
              px="16px"
              py="8px"
              fontSize="14px"
              fontWeight="500"
              color={activeTab === tab.id ? 'white' : colors.text.muted}
              bg={activeTab === tab.id ? colors.cobalt : 'transparent'}
              borderRadius="6px"
              cursor="pointer"
              transition="all 0.2s"
              _hover={{
                bg: activeTab === tab.id ? colors.cobalt : colors.patience,
              }}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </Box>
          ))}
        </Flex>
      </Flex>
    </Box>
  );
}
