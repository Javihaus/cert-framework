'use client';

import { ReactNode, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type CardVariant = 'default' | 'bordered' | 'elevated' | 'interactive';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverEffect?: boolean;
}

interface CardHeaderProps {
  children: ReactNode;
  action?: ReactNode;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

/**
 * Professional Card Component
 * Tailwind-only implementation based on DASHBOARD_DESIGN_SPEC.md
 */
export default function Card({
  children,
  variant = 'default',
  padding = 'md',
  hoverEffect = false,
  onClick,
  className,
  ...props
}: CardProps) {
  const isInteractive = hoverEffect || onClick || variant === 'interactive';

  return (
    <div
      onClick={onClick}
      className={cn(
        'card',
        paddingClasses[padding],
        onClick && 'cursor-pointer',
        isInteractive && 'transition-all duration-150 hover:-translate-y-0.5 hover:shadow-elevated hover:border-blue-500',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Card Header with optional action button
 */
export function CardHeader({ children, action }: CardHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
}

/**
 * Card Content wrapper
 */
export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn(className)}>{children}</div>;
}

/**
 * Card Title component for consistent heading styling
 */
export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white leading-snug">
      {children}
    </h3>
  );
}

/**
 * Card Description for secondary text
 */
export function CardDescription({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
      {children}
    </p>
  );
}
