'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { colors, spacing, typography } from '@/theme';

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
      <Box maxW="1600px" mx="auto" px={spacing.xl}>
        {/* Primary Navigation Bar - Button Style */}
        <Flex h="80px" align="center" gap={spacing['2xl']}>
          {/* Logo */}
          <Flex align="center" gap={spacing.sm}>
            <Box h="48px" display="flex" alignItems="center">
              <img
                src="/cert-logo.png"
                alt="CERT Logo"
                style={{ height: '48px', width: 'auto' }}
              />
            </Box>
            <Text
              fontSize={typography.fontSize['2xl']}
              fontWeight={typography.fontWeight.bold}
              color={colors.cobalt}
              letterSpacing={typography.letterSpacing.normal}
            >
              CERT
            </Text>
          </Flex>

          {/* Primary Tabs - Button Style (CLEARLY PRIMARY) */}
          <Flex gap={spacing.xs}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id || isParentActive(tab);

              return (
                <Box
                  key={tab.id}
                  as="button"
                  px="20px"
                  py="10px"
                  fontSize={typography.fontSize.sm}
                  fontWeight={typography.fontWeight.semibold}
                  color={
                    !tab.enabled
                      ? colors.text.muted
                      : isActive
                      ? 'white'
                      : colors.text.secondary
                  }
                  bg={isActive && tab.enabled ? colors.navy : 'transparent'}
                  borderRadius="8px"
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

        {/* Secondary Navigation - Underline Style (CLEARLY DIFFERENT) */}
        {tabs.find(t => t.id === 'monitoring')?.subtabs && isParentActive(tabs.find(t => t.id === 'monitoring')!) && (
          <Flex
            h="48px"
            align="center"
            gap={spacing.xl}
            borderTop="1px solid"
            borderColor={colors.patience}
            bg={colors.background}
            px="4px"
          >
            {tabs.find(t => t.id === 'monitoring')!.subtabs!.map((subtab) => {
              const isActive = activeTab === subtab.id;

              return (
                <Box
                  key={subtab.id}
                  as="button"
                  position="relative"
                  py={spacing.sm}
                  fontSize={typography.fontSize.sm}
                  fontWeight={isActive ? typography.fontWeight.semibold : typography.fontWeight.medium}
                  color={
                    !subtab.enabled
                      ? colors.text.muted
                      : isActive
                      ? colors.navy
                      : colors.text.secondary
                  }
                  cursor={subtab.enabled ? 'pointer' : 'not-allowed'}
                  opacity={subtab.enabled ? 1 : 0.5}
                  transition="all 0.2s"
                  bg="transparent"
                  border="none"
                  _hover={{
                    color: subtab.enabled ? colors.navy : colors.text.muted,
                  }}
                  onClick={() => subtab.enabled && onTabChange(subtab.id)}
                  _after={{
                    content: '""',
                    position: 'absolute',
                    bottom: '-1px',
                    left: '0',
                    right: '0',
                    height: '2px',
                    bg: isActive ? colors.navy : 'transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  {subtab.label}
                </Box>
              );
            })}
          </Flex>
        )}
      </Box>
    </Box>
  );
}
