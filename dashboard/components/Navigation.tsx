'use client';

import { Box, Flex, Text, Image } from '@chakra-ui/react';
import { colors } from '@/theme/colors';
import { spacing, radius, typography } from '@/theme/tokens';

interface Tab {
  id: 'home' | 'monitoring' | 'documentation';
  label: string;
}

interface NavigationProps {
  activeSection: 'home' | 'monitoring' | 'documentation';
  onSectionChange: (section: 'home' | 'monitoring' | 'documentation') => void;
}

export default function Navigation({
  activeSection,
  onSectionChange
}: NavigationProps) {

  const tabs: Tab[] = [
    { id: 'home', label: 'Home' },
    { id: 'monitoring', label: 'Monitoring' },
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
      boxShadow="0 1px 2px rgba(0, 0, 0, 0.05)"
    >
      <Box maxW="1600px" mx="auto" px={spacing.xl}>
        <Flex h="80px" align="center" justify="center" position="relative">

          {/* Logo - Positioned on the left */}
          <Flex align="center" gap={spacing.sm} position="absolute" left={spacing.xl}>
            <Box h="48px" display="flex" alignItems="center">
              <Image
                src="/cert-logo.png"
                alt="CERT Logo"
                height="48px"
                width="auto"
              />
            </Box>
            <Text
              fontSize={typography.fontSize['2xl']}
              fontWeight={typography.fontWeight.bold}
              color={colors.cobalt}
              letterSpacing={typography.letterSpacing.tight}
            >
              CERT
            </Text>
          </Flex>

          {/* Main Navigation Tabs - CENTERED */}
          <Flex gap={spacing.xs}>
            {tabs.map((tab) => {
              const isActive = activeSection === tab.id;

              return (
                <Box
                  key={tab.id}
                  as="button"
                  onClick={() => onSectionChange(tab.id)}
                  px={spacing.lg}
                  py={spacing.sm}
                  borderRadius={radius.md}
                  fontSize={typography.fontSize.base}
                  fontWeight={typography.fontWeight.medium}
                  color={isActive ? 'white' : colors.text.primary}
                  bg={isActive ? colors.navy : 'transparent'}
                  transition="all 0.2s"
                  cursor="pointer"
                  _hover={{
                    bg: isActive ? colors.navy : colors.background,
                  }}
                >
                  {tab.label}
                </Box>
              );
            })}
          </Flex>

        </Flex>
      </Box>
    </Box>
  );
}
