'use client';

import { ReactNode, forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import CircularProgress from '@mui/material/CircularProgress';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  success: 'btn-success',
  outline: 'btn-outline',
  link: 'btn-link',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

/**
 * Professional Button Component
 * Tailwind-only implementation based on DASHBOARD_DESIGN_SPEC.md
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
      className,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'btn',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          (disabled || loading) && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span className="flex">{icon}</span>
            )}
            {children}
            {icon && iconPosition === 'right' && (
              <span className="flex">{icon}</span>
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
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  'aria-label': string;
}

const iconButtonSizeClasses: Record<ButtonSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-9 h-9',
  lg: 'w-10 h-10',
};

export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-md transition-all duration-150',
        variantClasses[variant],
        iconButtonSizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
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
  gap?: 'sm' | 'md' | 'lg';
  direction?: 'row' | 'column';
}

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
};

export function ButtonGroup({
  children,
  gap = 'md',
  direction = 'row',
}: ButtonGroupProps) {
  return (
    <div
      className={cn(
        'flex',
        direction === 'column' ? 'flex-col' : 'flex-row',
        gapClasses[gap]
      )}
    >
      {children}
    </div>
  );
}

/**
 * Loading Spinner for buttons
 */
function LoadingSpinner() {
  return (
    <CircularProgress size={16} sx={{ color: 'currentColor' }} />
  );
}
