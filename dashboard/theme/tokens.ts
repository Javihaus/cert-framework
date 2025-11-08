/**
 * CERT Design Tokens
 * Swiss Minimalist Design System
 */

// ============================================================================
// TYPOGRAPHY - Clean, Helvetica-like (Inter)
// ============================================================================

export const typography = {
  fontFamily: {
    // Inter - clean, Helvetica-like, professional
    base: '-apple-system, BlinkMacSystemFont, "Inter", "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace',
  },

  fontSize: {
    // Larger, clearer sizes for better hierarchy
    xs: '12px',       // Tiny labels, metadata
    sm: '14px',       // Body text, card labels
    base: '16px',     // Main body text, descriptions
    lg: '18px',       // Large body, emphasis
    xl: '20px',       // Small section headers
    '2xl': '24px',    // Card headers (H3)
    '3xl': '30px',    // Metric values, H2
    '4xl': '36px',    // Page titles (H1)
    '5xl': '48px',    // Hero text (rarely used)
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.2,       // Headlines, metrics
    snug: 1.4,        // Subheadings
    normal: 1.5,      // Body text
    relaxed: 1.6,     // Long-form content
    loose: 1.8,       // Special cases
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',    // Small caps, labels
    wider: '0.05em',
  },
} as const;

// ============================================================================
// SPACING - More breathing room, 8px grid
// ============================================================================

export const spacing = {
  // Base 8px grid, generous spacing
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
  '4xl': '96px',

  // Component-specific
  cardPadding: '24px',      // Default card padding (was 20px)
  cardPaddingLg: '32px',    // Large card padding
  sectionGap: '48px',       // Gap between page sections
} as const;

// ============================================================================
// BORDERS & RADIUS
// ============================================================================

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
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
// SHADOWS - Subtle, professional
// ============================================================================

export const shadows = {
  card: '0 1px 3px rgba(17, 35, 88, 0.08)',
  cardHover: '0 4px 12px rgba(17, 35, 88, 0.12)',
  elevated: '0 8px 24px rgba(17, 35, 88, 0.15)',
  focus: '0 0 0 3px rgba(60, 96, 152, 0.2)',
} as const;

// ============================================================================
// CONTAINERS - Max widths for content
// ============================================================================

export const containers = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  content: '1200px',      // Standard content width
  contentNarrow: '900px', // Narrow content (forms, uploads)
} as const;

// ============================================================================
// TRANSITIONS
// ============================================================================

export const transitions = {
  fast: '0.15s',
  base: '0.2s',
  slow: '0.3s',
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;
