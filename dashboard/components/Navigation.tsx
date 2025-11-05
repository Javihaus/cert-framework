'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { colors } from '@/theme/colors';

interface Tab {
  id: string;
  label: string;
  enabled: boolean;
  subtabs?: Tab[];
}

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasData: boolean;
}

export default function Navigation({ activeTab, onTabChange, hasData }: NavigationProps) {
  const tabs: Tab[] = [
    { id: 'home', label: 'Home', enabled: true },
    {
      id: 'monitoring',
      label: 'Monitoring',
      enabled: true,
      subtabs: [
        { id: 'load', label: 'Load Data', enabled: true },
        { id: 'overview', label: 'Overview', enabled: hasData },
        { id: 'failed', label: 'Failed Traces', enabled: hasData },
        { id: 'distribution', label: 'Distribution', enabled: hasData },
        { id: 'report', label: 'Report', enabled: hasData },
      ]
    },
    { id: 'documents', label: 'Document Generation', enabled: true },
    { id: 'documentation', label: 'Documentation', enabled: true },
  ];

  // Helper to check if a parent tab contains the active tab
  const isParentActive = (tab: Tab) => {
    if (tab.subtabs) {
      return tab.subtabs.some(sub => sub.id === activeTab);
    }
    return false;
  };

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
        <Flex align="center" gap="12px">
          <Box h="40px" display="flex" alignItems="center">
            <img
              src="/cert-logo.png"
              alt="CERT Logo"
              style={{ height: '40px', width: 'auto' }}
            />
          </Box>
          <Text
            fontSize="24px"
            fontWeight="700"
            color={colors.cobalt}
            letterSpacing="-0.5px"
          >
            CERT
          </Text>
        </Flex>

        <Flex ml="48px" gap="4px">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id || isParentActive(tab);

            return (
              <Box key={tab.id} position="relative">
                <Box
                  as="button"
                  px="16px"
                  py="8px"
                  fontSize="14px"
                  fontWeight="500"
                  color={
                    !tab.enabled
                      ? colors.text.muted
                      : isActive
                      ? 'white'
                      : colors.text.secondary
                  }
                  bg={isActive && tab.enabled ? colors.cobalt : 'transparent'}
                  borderRadius="6px"
                  cursor={tab.enabled ? 'pointer' : 'not-allowed'}
                  opacity={tab.enabled ? 1 : 0.5}
                  transition="all 0.2s"
                  _hover={{
                    bg: tab.enabled
                      ? isActive
                        ? colors.cobalt
                        : colors.patience
                      : 'transparent',
                  }}
                  onClick={() => {
                    if (tab.enabled) {
                      // If tab has subtabs, navigate to first enabled subtab
                      if (tab.subtabs) {
                        const firstEnabled = tab.subtabs.find(st => st.enabled);
                        if (firstEnabled) {
                          onTabChange(firstEnabled.id);
                        }
                      } else {
                        onTabChange(tab.id);
                      }
                    }
                  }}
                >
                  {tab.label}
                </Box>

                {/* Subtabs dropdown */}
                {tab.subtabs && isParentActive(tab) && (
                  <Box
                    position="absolute"
                    top="100%"
                    left="0"
                    mt="4px"
                    bg="white"
                    borderRadius="6px"
                    boxShadow="md"
                    border="1px solid"
                    borderColor={colors.patience}
                    minW="180px"
                    py="4px"
                    zIndex="101"
                  >
                    {tab.subtabs.map((subtab) => (
                      <Box
                        key={subtab.id}
                        as="button"
                        display="block"
                        width="100%"
                        px="16px"
                        py="8px"
                        fontSize="13px"
                        fontWeight="400"
                        textAlign="left"
                        color={
                          !subtab.enabled
                            ? colors.text.muted
                            : activeTab === subtab.id
                            ? colors.cobalt
                            : colors.text.primary
                        }
                        bg={activeTab === subtab.id ? colors.patience : 'transparent'}
                        cursor={subtab.enabled ? 'pointer' : 'not-allowed'}
                        opacity={subtab.enabled ? 1 : 0.5}
                        transition="all 0.2s"
                        _hover={{
                          bg: subtab.enabled ? colors.patience : 'transparent',
                        }}
                        onClick={() => subtab.enabled && onTabChange(subtab.id)}
                      >
                        {subtab.label}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            );
          })}
        </Flex>
      </Flex>
    </Box>
  );
}
