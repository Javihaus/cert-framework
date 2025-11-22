'use client';

import { Box, Flex } from '@chakra-ui/react';
import { ReactNode, forwardRef } from 'react';
import {
  colors,
  borderRadius,
  spacing,
  shadows,
  transitions,
  componentTokens,
} from '@/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Record<string, unknown> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * Professional Button Component
 * Three primary variants: primary, secondary, ghost
 * Plus danger variant for destructive actions
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled = false,
      loading = false,
      onClick,
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const buttonSize = size as ButtonSize;
    const sizeStyles = componentTokens.button[buttonSize];

    const variantStyles = {
      primary: {
        bg: colors.primary[700],
        color: colors.text.inverse,
        border: 'none',
        _hover: {
          bg: colors.primary[500],
        },
        _active: {
          bg: colors.primary[800],
        },
      },
      secondary: {
        bg: colors.background,
        color: colors.primary[700],
        border: `2px solid ${colors.primary[700]}`,
        _hover: {
          bg: colors.neutral[100],
          borderColor: colors.primary[500],
        },
        _active: {
          bg: colors.neutral[200],
        },
      },
      ghost: {
        bg: 'transparent',
        color: colors.primary[500],
        border: 'none',
        _hover: {
          bg: colors.neutral[100],
        },
        _active: {
          bg: colors.neutral[200],
        },
      },
      danger: {
        bg: colors.accent[500],
        color: colors.text.inverse,
        border: 'none',
        _hover: {
          bg: colors.accent[600],
        },
        _active: {
          bg: colors.accent[600],
        },
      },
    };

    const style = variantStyles[variant];

    return (
      <Box
        as="button"
        ref={ref}
        type={type}
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        gap={spacing.xs}
        h={sizeStyles.height}
        px={size === 'sm' ? spacing.sm : spacing.lg}
        fontSize={sizeStyles.fontSize}
        fontWeight={500}
        fontFamily="inherit"
        borderRadius={sizeStyles.borderRadius}
        bg={style.bg}
        color={style.color}
        border={style.border}
        cursor={disabled || loading ? 'not-allowed' : 'pointer'}
        opacity={disabled ? 0.5 : 1}
        transition={transitions.all}
        width={fullWidth ? '100%' : 'auto'}
        onClick={disabled || loading ? undefined : onClick}
        _hover={disabled || loading ? undefined : style._hover}
        _active={disabled || loading ? undefined : style._active}
        _focus={{
          outline: 'none',
          boxShadow: shadows.focus,
        }}
        {...rest}
      >
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <Box as="span" display="flex">
                {icon}
              </Box>
            )}
            {children}
            {icon && iconPosition === 'right' && (
              <Box as="span" display="flex">
                {icon}
              </Box>
            )}
          </>
        )}
      </Box>
    );
  }
);

Button.displayName = 'Button';

export default Button;

/**
 * Icon Button - Square button for icons only
 */
interface IconButtonProps {
  icon: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  onClick?: () => void;
  'aria-label': string;
  [key: string]: unknown;
}

export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  onClick,
  'aria-label': ariaLabel,
  ...rest
}: IconButtonProps) {
  const sizeMap = {
    sm: '32px',
    md: '40px',
    lg: '48px',
  };

  const variantStyles = {
    primary: {
      bg: colors.primary[700],
      color: colors.text.inverse,
      _hover: { bg: colors.primary[500] },
    },
    secondary: {
      bg: colors.background,
      color: colors.primary[700],
      border: `1px solid ${colors.border.default}`,
      _hover: { bg: colors.neutral[100], borderColor: colors.primary[500] },
    },
    ghost: {
      bg: 'transparent',
      color: colors.text.secondary,
      _hover: { bg: colors.neutral[100], color: colors.primary[500] },
    },
    danger: {
      bg: colors.accent[100],
      color: colors.accent[500],
      _hover: { bg: colors.accent[500], color: colors.text.inverse },
    },
  };

  const style = variantStyles[variant];

  return (
    <Box
      as="button"
      display="flex"
      alignItems="center"
      justifyContent="center"
      w={sizeMap[size]}
      h={sizeMap[size]}
      borderRadius={borderRadius.md}
      bg={style.bg}
      color={style.color}
      border={style.border || 'none'}
      cursor={disabled ? 'not-allowed' : 'pointer'}
      opacity={disabled ? 0.5 : 1}
      transition={transitions.all}
      onClick={disabled ? undefined : onClick}
      aria-label={ariaLabel}
      _hover={disabled ? undefined : style._hover}
      _focus={{
        outline: 'none',
        boxShadow: shadows.focus,
      }}
      {...rest}
    >
      {icon}
    </Box>
  );
}

/**
 * Button Group - For grouping related buttons
 */
interface ButtonGroupProps {
  children: ReactNode;
  spacing?: string;
  direction?: 'row' | 'column';
}

export function ButtonGroup({
  children,
  spacing: gap = spacing.sm,
  direction = 'row',
}: ButtonGroupProps) {
  return (
    <Flex direction={direction} gap={gap}>
      {children}
    </Flex>
  );
}

/**
 * Loading Spinner for buttons
 */
function LoadingSpinner() {
  return (
    <Box
      as="span"
      display="inline-block"
      w="16px"
      h="16px"
      border="2px solid currentColor"
      borderRightColor="transparent"
      borderRadius="50%"
      animation="spin 0.6s linear infinite"
      sx={{
        '@keyframes spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      }}
    />
  );
}
