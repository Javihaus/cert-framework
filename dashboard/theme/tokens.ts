/**
 * CERT Design Tokens
 * Professional Design System based on DASHBOARD_DESIGN_SPEC.md
 *
 * Typography, spacing, shadows, and visual elements for EU AI Act dashboard.
 */

// ============================================================================
// TYPOGRAPHY - Inter for UI, JetBrains Mono for code
// ============================================================================

export const typography = {
  fontFamily: {
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "SF Mono", "Monaco", "Inconsolata", monospace',
  },

  // Font sizes from spec: xs (12px) through 3xl (30px)
  fontSize: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    lg: '16px',
    xl: '18px',
    '2xl': '24px',
    '3xl': '30px',
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
  },

  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
  },

  letterSpacing: {
    tight: '-0.01em',
    normal: '0',
    wide: '0.025em',
  },
} as const;

// ============================================================================
// SPACING - Single scale from spec
// ============================================================================

export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',

  // Component-specific (from spec)
  sidebarWidth: '240px',
  headerHeight: '56px',
  cardPadding: '20px',
  sectionGap: '24px',
} as const;

// ============================================================================
// BORDER RADIUS - From spec
// ============================================================================

export const borderRadius = {
  sm: '4px',
  DEFAULT: '6px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  full: '9999px',
} as const;

export const radius = borderRadius;

// ============================================================================
// SHADOWS - From spec
// ============================================================================

export const shadows = {
  none: 'none',
  card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  elevated: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',

  // Focus ring from spec: 2px white outline + 4px brand color ring
  focus: '0 0 0 2px #FFFFFF, 0 0 0 4px #2563EB',
  focusError: '0 0 0 2px #FFFFFF, 0 0 0 4px #EF4444',
} as const;

// ============================================================================
// TRANSITIONS - 150ms from spec
// ============================================================================

export const transitions = {
  fast: '150ms',
  base: '150ms',
  slow: '200ms',

  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',

  all: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  colors: 'color 150ms ease, background-color 150ms ease, border-color 150ms ease',
  transform: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  opacity: 'opacity 150ms ease',
  shadow: 'box-shadow 150ms ease',
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const media = {
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
} as const;

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 300,
  popover: 400,
  tooltip: 500,
  toast: 600,
  overlay: 700,
} as const;

// ============================================================================
// COMPONENT TOKENS - Button, Badge, Card sizes from spec
// ============================================================================

export const componentTokens = {
  // Button heights from spec: 32px (sm), 36px (default), 40px (lg)
  button: {
    sm: {
      height: '32px',
      padding: '0 16px',
      fontSize: '13px',
      borderRadius: '6px',
    },
    md: {
      height: '36px',
      padding: '0 16px',
      fontSize: '13px',
      borderRadius: '6px',
    },
    lg: {
      height: '40px',
      padding: '0 16px',
      fontSize: '13px',
      borderRadius: '6px',
    },
  },

  // Badge from spec: 2px × 8px padding, 4px radius, 12px medium text
  badge: {
    sm: {
      height: '20px',
      padding: '2px 8px',
      fontSize: '12px',
      borderRadius: '4px',
    },
    md: {
      height: '24px',
      padding: '2px 8px',
      fontSize: '12px',
      borderRadius: '4px',
    },
    lg: {
      height: '28px',
      padding: '2px 8px',
      fontSize: '12px',
      borderRadius: '4px',
    },
  },

  // Card from spec
  card: {
    default: {
      background: '#FFFFFF',
      border: '1px solid #E4E4E7',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    },
  },

  // Navigation items from spec: 8px × 12px padding, 6px radius, 13px medium text
  navItem: {
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
  },

  // Table from spec
  table: {
    headerBg: '#FAFAFA',
    headerFontSize: '11px',
    rowPadding: '16px',
    rowFontSize: '13px',
    hoverBg: '#FAFAFA',
  },

  // Chart from spec
  chart: {
    padding: '20px',
    height: '240px',
    strokeWidth: '2px',
    gridColor: '#F4F4F5',
    tooltipBg: '#09090B',
    tooltipText: '#FFFFFF',
    tooltipPadding: '8px 12px',
  },
} as const;

// Type exports
export type Spacing = typeof spacing;
export type Typography = typeof typography;
export type Shadows = typeof shadows;
export type BorderRadius = typeof borderRadius;
export type Breakpoints = typeof breakpoints;
