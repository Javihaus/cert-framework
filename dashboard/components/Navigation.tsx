'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { colors } from '@/theme/colors';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasData: boolean;
}

export default function Navigation({ activeTab, onTabChange, hasData }: NavigationProps) {
  const tabs = [
    { id: 'load', label: 'Load Data', enabled: true },
    { id: 'overview', label: 'Overview', enabled: hasData },
    { id: 'failed', label: 'Failed Traces', enabled: hasData },
    { id: 'distribution', label: 'Distribution', enabled: hasData },
    { id: 'documentation', label: 'Documentation', enabled: hasData },
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
              color={
                !tab.enabled
                  ? colors.text.muted
                  : activeTab === tab.id
                  ? 'white'
                  : colors.text.secondary
              }
              bg={activeTab === tab.id && tab.enabled ? colors.cobalt : 'transparent'}
              borderRadius="6px"
              cursor={tab.enabled ? 'pointer' : 'not-allowed'}
              opacity={tab.enabled ? 1 : 0.5}
              transition="all 0.2s"
              _hover={{
                bg: tab.enabled
                  ? activeTab === tab.id
                    ? colors.cobalt
                    : colors.patience
                  : 'transparent',
              }}
              onClick={() => tab.enabled && onTabChange(tab.id)}
            >
              {tab.label}
            </Box>
          ))}
        </Flex>
      </Flex>
    </Box>
  );
}
