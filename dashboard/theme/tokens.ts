/**
 * CERT Dashboard Design Tokens
 *
 * Centralized design system for consistent spacing, typography, and visual hierarchy
 * across the entire dashboard. These tokens replace hardcoded values and ensure
 * professional, maintainable styling.
 */

// =============================================================================
// SPACING SYSTEM
// =============================================================================

export const spacing = {
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
  '4xl': '96px',
} as const;

// =============================================================================
// TYPOGRAPHY SYSTEM
// =============================================================================

export const typography = {
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '40px',
    '5xl': '56px',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.1',
    snug: '1.3',
    normal: '1.5',
    relaxed: '1.6',
    loose: '1.7',
  },
  letterSpacing: {
    tight: '-2px',
    snug: '-1px',
    normal: '0',
    wide: '0.5px',
  },
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================

export const borderRadius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  full: '9999px',
} as const;

// =============================================================================
// SHADOWS
// =============================================================================

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
} as const;

// =============================================================================
// COMPONENT-SPECIFIC TOKENS
// =============================================================================

export const components = {
  navigation: {
    height: '64px',
    subnavHeight: '48px',
    logoSize: '40px',
  },
  card: {
    padding: {
      sm: spacing.lg,
      md: spacing.xl,
      lg: spacing['2xl'],
    },
    borderWidth: '1px',
  },
  button: {
    height: {
      sm: '40px',
      md: '48px',
      lg: '56px',
    },
    padding: {
      x: spacing.lg,
      y: spacing.sm,
    },
  },
  input: {
    height: '44px',
    padding: spacing.md,
  },
} as const;

// =============================================================================
// BREAKPOINTS
// =============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1600px',
} as const;
