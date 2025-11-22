/**
 * CERT Design Tokens
 * Professional SaaS Dashboard Design System
 *
 * Maximum 6 typography sizes, 8px grid spacing,
 * consistent shadows and transitions for €5K+ dashboard.
 */

// ============================================================================
// TYPOGRAPHY - Clean, Professional (Inter) - 6 Sizes Maximum
// ============================================================================

export const typography = {
  fontFamily: {
    base: '"Inter", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace',
  },

  // Strict 6-size scale for visual consistency
  fontSize: {
    xs: '12px', // Tiny labels, metadata, badges
    sm: '14px', // Small text, secondary info
    base: '16px', // Body text (default)
    lg: '20px', // Subheadings, card titles (H3)
    xl: '24px', // Section headers (H2)
    '2xl': '32px', // Page titles (H1)
    hero: '48px', // Hero sections (rarely used)
    // Legacy aliases for backward compatibility
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.2, // Headlines, metrics
    snug: 1.4, // Subheadings
    normal: 1.5, // Body text
    relaxed: 1.6, // Long-form content
    loose: 1.8, // Special cases
  },

  letterSpacing: {
    tighter: '-0.02em', // Hero text
    tight: '-0.01em', // Headlines
    normal: '0',
    wide: '0.025em', // Small caps, labels
    wider: '0.05em',
  },

  // Pre-configured text styles for consistency
  styles: {
    hero: {
      fontSize: '48px',
      lineHeight: 1.2,
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h1: {
      fontSize: '32px',
      lineHeight: 1.25,
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h2: {
      fontSize: '24px',
      lineHeight: 1.3,
      fontWeight: 600,
      letterSpacing: '0',
    },
    h3: {
      fontSize: '20px',
      lineHeight: 1.4,
      fontWeight: 500,
      letterSpacing: '0',
    },
    body: {
      fontSize: '16px',
      lineHeight: 1.5,
      fontWeight: 400,
      letterSpacing: '0',
    },
    small: {
      fontSize: '14px',
      lineHeight: 1.5,
      fontWeight: 400,
      letterSpacing: '0',
    },
    tiny: {
      fontSize: '12px',
      lineHeight: 1.4,
      fontWeight: 400,
      letterSpacing: '0.025em',
    },
  },
} as const;

// ============================================================================
// SPACING - 8px Grid System
// ============================================================================

export const spacing = {
  // Base 8px grid
  xs: '8px', // Inline elements, tight gaps
  sm: '12px', // Tight groups, input padding
  md: '16px', // Default spacing
  lg: '24px', // Section gaps, card padding
  xl: '32px', // Major sections
  '2xl': '48px', // Page sections
  '3xl': '64px', // Hero sections
  '4xl': '96px', // Extra large gaps

  // Component-specific (semantic)
  cardPadding: '24px',
  cardPaddingLg: '32px',
  cardPaddingSm: '16px',
  sectionGap: '48px',
  pageGap: '32px',
  navHeight: '80px',
  sidebarWidth: '280px',
} as const;

// ============================================================================
// BREAKPOINTS - Mobile-first Responsive
// ============================================================================

export const breakpoints = {
  mobile: '320px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
  ultrawide: '1536px',
} as const;

// Media query helpers
export const media = {
  mobile: `@media (min-width: ${breakpoints.mobile})`,
  tablet: `@media (min-width: ${breakpoints.tablet})`,
  desktop: `@media (min-width: ${breakpoints.desktop})`,
  wide: `@media (min-width: ${breakpoints.wide})`,
  ultrawide: `@media (min-width: ${breakpoints.ultrawide})`,
} as const;

// ============================================================================
// BORDERS & RADIUS
// ============================================================================

export const borderRadius = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px',
} as const;

// Alias for backwards compatibility
export const radius = borderRadius;

export const borderWidth = {
  thin: '1px',
  medium: '2px',
  thick: '4px',
} as const;

// ============================================================================
// SHADOWS - Professional, Consistent System
// ============================================================================

export const shadows = {
  // Standard elevation system
  none: 'none',
  sm: '0 1px 2px 0 rgba(12, 18, 27, 0.05)',
  card: '0 1px 3px rgba(12, 18, 27, 0.08), 0 1px 2px rgba(12, 18, 27, 0.04)',
  cardHover:
    '0 4px 6px -1px rgba(12, 18, 27, 0.1), 0 2px 4px -1px rgba(12, 18, 27, 0.06)',
  elevated:
    '0 10px 15px -3px rgba(12, 18, 27, 0.1), 0 4px 6px -2px rgba(12, 18, 27, 0.05)',
  modal:
    '0 25px 50px -12px rgba(12, 18, 27, 0.25), 0 10px 10px -5px rgba(12, 18, 27, 0.04)',

  // Focus states
  focus: '0 0 0 3px rgba(28, 112, 173, 0.2)',
  focusError: '0 0 0 3px rgba(229, 117, 106, 0.2)',

  // Inner shadows
  inner: 'inset 0 2px 4px 0 rgba(12, 18, 27, 0.06)',
} as const;

// ============================================================================
// CONTAINERS - Max widths for content
// ============================================================================

export const containers = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  content: '1200px', // Standard content width
  contentNarrow: '900px', // Narrow content (forms, uploads)
  contentWide: '1400px', // Wide content (dashboards)
} as const;

// ============================================================================
// TRANSITIONS - Smooth, Consistent Animations
// ============================================================================

export const transitions = {
  // Durations
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
  slower: '400ms',

  // Easings
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easingIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easingOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easingBounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',

  // Pre-configured transitions
  all: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  colors:
    'color 200ms ease, background-color 200ms ease, border-color 200ms ease',
  transform: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  opacity: 'opacity 200ms ease',
  shadow: 'box-shadow 200ms ease',
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
// COMPONENT TOKENS - Pre-configured component styles
// ============================================================================

export const componentTokens = {
  // Button sizes
  button: {
    sm: {
      height: '32px',
      padding: '8px 12px',
      fontSize: '14px',
      borderRadius: '6px',
    },
    md: {
      height: '40px',
      padding: '10px 16px',
      fontSize: '14px',
      borderRadius: '8px',
    },
    lg: {
      height: '48px',
      padding: '12px 24px',
      fontSize: '16px',
      borderRadius: '8px',
    },
  },

  // Input sizes
  input: {
    sm: {
      height: '32px',
      padding: '8px 12px',
      fontSize: '14px',
    },
    md: {
      height: '40px',
      padding: '10px 14px',
      fontSize: '14px',
    },
    lg: {
      height: '48px',
      padding: '12px 16px',
      fontSize: '16px',
    },
  },

  // Card variants
  card: {
    default: {
      background: '#F2F3F4',
      border: 'none',
      borderRadius: '12px',
      padding: '24px',
    },
    elevated: {
      background: '#FFFFFF',
      border: 'none',
      borderRadius: '12px',
      padding: '24px',
      boxShadow:
        '0 4px 6px -1px rgba(12, 18, 27, 0.1), 0 2px 4px -1px rgba(12, 18, 27, 0.06)',
    },
    bordered: {
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '12px',
      padding: '24px',
    },
  },

  // Badge sizes
  badge: {
    sm: {
      height: '20px',
      padding: '0 6px',
      fontSize: '11px',
      borderRadius: '4px',
    },
    md: {
      height: '24px',
      padding: '0 8px',
      fontSize: '12px',
      borderRadius: '6px',
    },
    lg: {
      height: '28px',
      padding: '0 10px',
      fontSize: '13px',
      borderRadius: '6px',
    },
  },

  // Avatar sizes
  avatar: {
    sm: '32px',
    md: '40px',
    lg: '48px',
    xl: '64px',
  },
} as const;

// Type exports
export type Spacing = typeof spacing;
export type Typography = typeof typography;
export type Shadows = typeof shadows;
export type BorderRadius = typeof borderRadius;
export type Breakpoints = typeof breakpoints;
