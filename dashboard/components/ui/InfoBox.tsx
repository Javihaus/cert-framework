import { Box, Flex, Text } from '@chakra-ui/react';
import { colors, spacing, borderRadius, typography, icons, iconSizes } from '@/theme';
import { ReactNode } from 'react';

interface InfoBoxProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: ReactNode;
}

export function InfoBox({ type, title, children }: InfoBoxProps) {
  // ONLY use colors from the palette
  const styles = {
    info: {
      bg: colors.patience,      // #E6DDD6 - From palette
      border: colors.cobalt,     // #3C6098 - From palette
      icon: icons.info,
      iconColor: colors.cobalt,
    },
    success: {
      bg: colors.patience,       // Same background for consistency
      border: colors.success,    // From palette
      icon: icons.success,
      iconColor: colors.success,
    },
    warning: {
      bg: colors.patience,       // Same background
      border: colors.coral,      // #E48B59 - From palette (Aegean Sky)
      icon: icons.warning,
      iconColor: colors.coral,
    },
    error: {
      bg: colors.patience,       // Same background
      border: colors.error,      // From palette
      icon: icons.error,
      iconColor: colors.error,
    },
  };

  const style = styles[type];
  const IconComponent = style.icon;

  return (
    <Box
      bg={style.bg}
      border="1px solid"
      borderColor={style.border}
      borderRadius={borderRadius.md}
      p={spacing.md}
    >
      <Flex gap={spacing.sm}>
        {/* Icon */}
        <Box flexShrink={0} mt="2px">
          <IconComponent size={iconSizes.md} color={style.iconColor} />
        </Box>

        {/* Content */}
        <Box flex="1">
          {title && (
            <Text
              fontSize={typography.fontSize.base}
              fontWeight={typography.fontWeight.semibold}
              color={colors.text.primary}
              mb={spacing.xs}
            >
              {title}
            </Text>
          )}
          <Text
            fontSize={typography.fontSize.sm}
            color={colors.text.secondary}
            lineHeight={typography.lineHeight.relaxed}
          >
            {children}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
}
