'use client';

import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { colors } from '@/theme/colors';
import { spacing, radius, typography } from '@/theme/tokens';
import { icons, iconSizes } from '@/theme/icons';

interface SidebarItem {
  id: string;
  label: string;
  icon: any;
  enabled: boolean;
}

interface MonitoringSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasData: boolean;
}

export default function MonitoringSidebar({
  activeTab,
  onTabChange,
  hasData
}: MonitoringSidebarProps) {

  const items: SidebarItem[] = [
    { id: 'load', label: 'Load Data', icon: icons.upload, enabled: true },
    { id: 'overview', label: 'Overview', icon: icons.dashboard, enabled: hasData },
    { id: 'failed', label: 'Failed Traces', icon: icons.warning, enabled: hasData },
    { id: 'distribution', label: 'Distribution', icon: icons.chart, enabled: hasData },
    { id: 'documents', label: 'Documents', icon: icons.document, enabled: hasData },
  ];

  return (
    <Box
      w="240px"
      h="100%"
      bg="white"
      borderRight="1px solid"
      borderColor={colors.patience}
      position="fixed"
      left="0"
      top="80px"
      bottom="0"
      pt={spacing.xl}
      overflowY="auto"
      display={{ base: 'none', md: 'flex' }}
      flexDirection="column"
    >
      {/* Section Title */}
      <Text
        px={spacing.lg}
        mb={spacing.md}
        fontSize={typography.fontSize.xs}
        fontWeight={typography.fontWeight.semibold}
        color={colors.text.muted}
        textTransform="uppercase"
        letterSpacing="0.05em"
      >
        Monitoring
      </Text>

      {/* Navigation Items */}
      <Flex direction="column" gap={spacing.xs} px={spacing.sm}>
        {items.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <Box
              key={item.id}
              as="button"
              onClick={() => item.enabled && onTabChange(item.id)}
              w="100%"
              px={spacing.md}
              py={spacing.sm}
              borderRadius={radius.md}
              display="flex"
              alignItems="center"
              gap={spacing.sm}
              cursor={item.enabled ? 'pointer' : 'not-allowed'}
              transition="all 0.2s"
              bg={isActive ? colors.navy : 'transparent'}
              color={
                !item.enabled
                  ? colors.text.muted
                  : isActive
                  ? 'white'
                  : colors.text.primary
              }
              opacity={item.enabled ? 1 : 0.4}
              pointerEvents={item.enabled ? 'auto' : 'none'}
              _hover={
                item.enabled
                  ? {
                      bg: isActive ? colors.navy : colors.background,
                    }
                  : {}
              }
              fontWeight={isActive ? typography.fontWeight.semibold : typography.fontWeight.medium}
              fontSize={typography.fontSize.sm}
            >
              {/* Icon */}
              <Icon size={iconSizes.sm} />

              {/* Label */}
              <Text flex="1" textAlign="left">
                {item.label}
              </Text>
            </Box>
          );
        })}
      </Flex>

      {/* Privacy Notice */}
      <Box
        mt="auto"
        px={spacing.lg}
        py={spacing.xl}
        borderTop="1px solid"
        borderColor={colors.patience}
      >
        <Flex align="flex-start" gap={spacing.xs}>
          {React.createElement(icons.lock, { size: iconSizes.sm, color: colors.text.muted, style: { marginTop: '2px' } })}
          <Text
            fontSize={typography.fontSize.xs}
            color={colors.text.muted}
            lineHeight={typography.lineHeight.relaxed}
          >
            Your data stays private. All processing happens locally in your browser.
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}
