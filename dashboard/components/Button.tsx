'use client';

import { Flex } from '@chakra-ui/react';
import { ReactNode, forwardRef, CSSProperties } from 'react';
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

interface ButtonProps {
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

const variantStyles: Record<ButtonVariant, { bg: string; color: string; border: string; hoverBg: string }> = {
  primary: {
    bg: colors.primary[700],
    color: colors.text.inverse,
    border: 'none',
    hoverBg: colors.primary[500],
  },
  secondary: {
    bg: colors.background,
    color: colors.primary[700],
    border: `2px solid ${colors.primary[700]}`,
    hoverBg: colors.neutral[100],
  },
  ghost: {
    bg: 'transparent',
    color: colors.primary[500],
    border: 'none',
    hoverBg: colors.neutral[100],
  },
  danger: {
    bg: colors.accent[500],
    color: colors.text.inverse,
    border: 'none',
    hoverBg: colors.accent[600],
  },
};

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
    },
    ref
  ) => {
    const sizeStyles = componentTokens.button[size];
    const style = variantStyles[variant];

    const buttonStyle: CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      height: sizeStyles.height,
      padding: `0 ${size === 'sm' ? spacing.sm : spacing.lg}`,
      fontSize: sizeStyles.fontSize,
      fontWeight: 500,
      fontFamily: 'inherit',
      borderRadius: sizeStyles.borderRadius,
      backgroundColor: style.bg,
      color: style.color,
      border: style.border,
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: transitions.all,
      width: fullWidth ? '100%' : 'auto',
      outline: 'none',
    };

    return (
      <button
        ref={ref}
        type={type}
        style={buttonStyle}
        onClick={disabled || loading ? undefined : onClick}
        disabled={disabled || loading}
        onMouseOver={(e) => {
          if (!disabled && !loading) {
            e.currentTarget.style.backgroundColor = style.hoverBg;
          }
        }}
        onMouseOut={(e) => {
          if (!disabled && !loading) {
            e.currentTarget.style.backgroundColor = style.bg;
          }
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = shadows.focus;
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span style={{ display: 'flex' }}>{icon}</span>
            )}
            {children}
            {icon && iconPosition === 'right' && (
              <span style={{ display: 'flex' }}>{icon}</span>
            )}
          </>
        )}
      </button>
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
}

const iconButtonVariantStyles: Record<ButtonVariant, { bg: string; color: string; border: string; hoverBg: string; hoverColor?: string }> = {
  primary: {
    bg: colors.primary[700],
    color: colors.text.inverse,
    border: 'none',
    hoverBg: colors.primary[500],
  },
  secondary: {
    bg: colors.background,
    color: colors.primary[700],
    border: `1px solid ${colors.border.default}`,
    hoverBg: colors.neutral[100],
  },
  ghost: {
    bg: 'transparent',
    color: colors.text.secondary,
    border: 'none',
    hoverBg: colors.neutral[100],
    hoverColor: colors.primary[500],
  },
  danger: {
    bg: colors.accent[100],
    color: colors.accent[500],
    border: 'none',
    hoverBg: colors.accent[500],
    hoverColor: colors.text.inverse,
  },
};

const iconButtonSizeMap = {
  sm: '32px',
  md: '40px',
  lg: '48px',
};

export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  onClick,
  'aria-label': ariaLabel,
}: IconButtonProps) {
  const style = iconButtonVariantStyles[variant];

  const buttonStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: iconButtonSizeMap[size],
    height: iconButtonSizeMap[size],
    borderRadius: borderRadius.md,
    backgroundColor: style.bg,
    color: style.color,
    border: style.border,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: transitions.all,
    outline: 'none',
  };

  return (
    <button
      type="button"
      style={buttonStyle}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      onMouseOver={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = style.hoverBg;
          if (style.hoverColor) {
            e.currentTarget.style.color = style.hoverColor;
          }
        }
      }}
      onMouseOut={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = style.bg;
          e.currentTarget.style.color = style.color;
        }
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = shadows.focus;
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {icon}
    </button>
  );
}

/**
 * Button Group - For grouping related buttons
 */
interface ButtonGroupProps {
  children: ReactNode;
  gap?: string;
  direction?: 'row' | 'column';
}

export function ButtonGroup({
  children,
  gap: gapSize = spacing.sm,
  direction = 'row',
}: ButtonGroupProps) {
  return (
    <Flex direction={direction} gap={gapSize}>
      {children}
    </Flex>
  );
}

/**
 * Loading Spinner for buttons
 */
function LoadingSpinner() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: '16px',
        height: '16px',
        border: '2px solid currentColor',
        borderRightColor: 'transparent',
        borderRadius: '50%',
        animation: 'button-spin 0.6s linear infinite',
      }}
    />
  );
}

// Add keyframes via style tag injection
if (typeof document !== 'undefined') {
  const styleId = 'button-spinner-keyframes';
  if (!document.getElementById(styleId)) {
    const styleTag = document.createElement('style');
    styleTag.id = styleId;
    styleTag.textContent = `
      @keyframes button-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleTag);
  }
}
