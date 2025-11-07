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
        { id: 'documents', label: 'Documents', enabled: hasData },
      ]
    },
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
      <Box maxW="1600px" mx="auto" px="32px">
        {/* Main Navigation Bar */}
        <Flex h="64px" align="center">
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
                <Box
                  key={tab.id}
                  as="button"
                  px="16px"
                  py="8px"
                  fontSize="15px"
                  fontWeight="500"
                  color={
                    !tab.enabled
                      ? colors.text.muted
                      : isActive
                      ? 'white'
                      : colors.text.secondary
                  }
                  bg={isActive && tab.enabled ? colors.navy : 'transparent'}
                  borderRadius="6px"
                  cursor={tab.enabled ? 'pointer' : 'not-allowed'}
                  opacity={tab.enabled ? 1 : 0.5}
                  transition="all 0.2s"
                  _hover={{
                    bg: tab.enabled
                      ? isActive
                        ? colors.navy
                        : colors.mist
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
              );
            })}
          </Flex>
        </Flex>

        {/* Horizontal Subtabs for Monitoring */}
        {tabs.find(t => t.id === 'monitoring')?.subtabs && isParentActive(tabs.find(t => t.id === 'monitoring')!) && (
          <Flex
            h="48px"
            align="center"
            gap="2px"
            borderTop="1px solid"
            borderColor={colors.patience}
            bg={colors.background}
          >
            {tabs.find(t => t.id === 'monitoring')!.subtabs!.map((subtab) => (
              <Box
                key={subtab.id}
                as="button"
                px="16px"
                py="8px"
                fontSize="14px"
                fontWeight="500"
                color={
                  !subtab.enabled
                    ? colors.text.muted
                    : activeTab === subtab.id
                    ? colors.navy
                    : colors.text.secondary
                }
                bg={activeTab === subtab.id ? 'white' : 'transparent'}
                borderRadius="6px"
                cursor={subtab.enabled ? 'pointer' : 'not-allowed'}
                opacity={subtab.enabled ? 1 : 0.5}
                transition="all 0.2s"
                _hover={{
                  bg: subtab.enabled
                    ? activeTab === subtab.id
                      ? 'white'
                      : colors.mist
                    : 'transparent',
                }}
                onClick={() => subtab.enabled && onTabChange(subtab.id)}
              >
                {subtab.label}
              </Box>
            ))}
          </Flex>
        )}
      </Box>
    </Box>
  );
}
