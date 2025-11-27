/**
 * CERT Design Tokens
 * Design System based on Stripe Dashboard UI
 *
 * Typography, spacing, shadows, and visual elements for EU AI Act dashboard.
 */

// ============================================================================
// TYPOGRAPHY - System font stack (Stripe-style)
// ============================================================================

export const typography = {
  fontFamily: {
    // Stripe uses system fonts primarily
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
    mono: '"SF Mono", "Monaco", "Inconsolata", "Fira Mono", "Droid Sans Mono", monospace',
  },

  // Font sizes (Stripe-style hierarchy)
  fontSize: {
    xs: '11px',      // Labels, uppercase section headers
    sm: '13px',      // Secondary text, nav items
    base: '14px',    // Body text
    lg: '15px',      // Emphasized body
    xl: '17px',      // Subheadings
    '2xl': '20px',   // Card titles
    '3xl': '24px',   // Section titles
    '4xl': '28px',   // Page titles
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.2,
    snug: 1.35,
    normal: 1.5,
    relaxed: 1.6,
  },

  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.04em',    // For uppercase labels
    wider: '0.06em',   // For section headers
  },
} as const;

// ============================================================================
// SPACING - Stripe-style scale
// ============================================================================

export const spacing = {
  0: '0px',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',

  // Component-specific (Stripe-style)
  sidebarWidth: '220px',      // Stripe's sidebar width
  headerHeight: '52px',       // Stripe's header height
  cardPadding: '16px',        // Stripe uses tighter padding
  cardPaddingLg: '24px',      // Larger cards
  sectionGap: '24px',
  pageMargin: '32px',
} as const;

// ============================================================================
// BORDER RADIUS - Stripe uses smaller radius
// ============================================================================

export const borderRadius = {
  none: '0px',
  sm: '4px',        // Badges, small elements
  DEFAULT: '6px',   // Buttons, inputs
  md: '6px',
  lg: '8px',        // Cards
  xl: '12px',       // Large cards, modals
  full: '9999px',   // Pills, avatars
} as const;

export const radius = borderRadius;

// ============================================================================
// SHADOWS - Stripe-style subtle shadows
// ============================================================================

export const shadows = {
  none: 'none',
  // Stripe's subtle card shadow
  card: '0 0 0 1px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.04)',
  // Elevated elements
  elevated: '0 2px 5px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.05)',
  // Dropdown menus
  dropdown: '0 4px 12px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08)',
  // Modal overlay
  modal: '0 8px 30px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)',

  // Focus ring (Stripe purple)
  focus: '0 0 0 2px #FFFFFF, 0 0 0 4px #635BFF',
  focusError: '0 0 0 2px #FFFFFF, 0 0 0 4px #DF1B41',
} as const;

// ============================================================================
// TRANSITIONS - Stripe uses smooth 200ms
// ============================================================================

export const transitions = {
  fast: '100ms',
  base: '200ms',
  slow: '300ms',

  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easingIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easingOut: 'cubic-bezier(0, 0, 0.2, 1)',

  all: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  colors: 'color 200ms ease, background-color 200ms ease, border-color 200ms ease',
  transform: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  opacity: 'opacity 200ms ease',
  shadow: 'box-shadow 200ms ease',
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
// COMPONENT TOKENS - Stripe-style components
// ============================================================================

export const componentTokens = {
  // Button (Stripe-style)
  button: {
    sm: {
      height: '28px',
      padding: '0 10px',
      fontSize: '13px',
      borderRadius: '6px',
    },
    md: {
      height: '32px',
      padding: '0 12px',
      fontSize: '14px',
      borderRadius: '6px',
    },
    lg: {
      height: '36px',
      padding: '0 16px',
      fontSize: '14px',
      borderRadius: '6px',
    },
  },

  // Badge (Stripe-style pills)
  badge: {
    sm: {
      height: '18px',
      padding: '0 6px',
      fontSize: '11px',
      borderRadius: '4px',
      fontWeight: 500,
    },
    md: {
      height: '20px',
      padding: '1px 8px',
      fontSize: '12px',
      borderRadius: '4px',
      fontWeight: 500,
    },
    lg: {
      height: '24px',
      padding: '2px 10px',
      fontSize: '13px',
      borderRadius: '4px',
      fontWeight: 500,
    },
  },

  // Card (Stripe-style)
  card: {
    default: {
      background: '#FFFFFF',
      border: '1px solid #E3E8EE',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.05)',
    },
    interactive: {
      background: '#FFFFFF',
      border: '1px solid #E3E8EE',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.05)',
      hoverBorder: '#C1C9D2',
      hoverShadow: '0 2px 5px rgba(0, 0, 0, 0.08)',
    },
  },

  // Navigation items (Stripe-style)
  navItem: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    gap: '10px',
    iconSize: '16px',
  },

  // Section label (Stripe uppercase headers)
  sectionLabel: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },

  // Tabs (Stripe underline style)
  tabs: {
    fontSize: '14px',
    fontWeight: 500,
    padding: '12px 0',
    gap: '24px',
    indicatorHeight: '2px',
    indicatorColor: '#635BFF',
  },

  // Table (Stripe-style)
  table: {
    headerBg: '#F6F9FC',
    headerFontSize: '11px',
    headerFontWeight: 600,
    headerLetterSpacing: '0.04em',
    rowPadding: '12px 16px',
    rowFontSize: '14px',
    hoverBg: '#F6F9FC',
    borderColor: '#E3E8EE',
  },

  // Input (Stripe-style)
  input: {
    height: '36px',
    padding: '0 12px',
    fontSize: '14px',
    borderRadius: '6px',
    borderColor: '#E3E8EE',
    focusBorderColor: '#635BFF',
  },

  // Chart (Stripe-style)
  chart: {
    padding: '20px',
    height: '240px',
    strokeWidth: '2px',
    gridColor: '#EDF1F7',
    tooltipBg: '#0A2540',
    tooltipText: '#FFFFFF',
    tooltipPadding: '8px 12px',
    tooltipRadius: '6px',
  },

  // Search bar (Stripe-style centered)
  searchBar: {
    maxWidth: '400px',
    height: '36px',
    borderRadius: '8px',
    background: '#F6F9FC',
    borderColor: '#E3E8EE',
    iconSize: '16px',
  },
} as const;

// Type exports
export type Spacing = typeof spacing;
export type Typography = typeof typography;
export type Shadows = typeof shadows;
export type BorderRadius = typeof borderRadius;
export type Breakpoints = typeof breakpoints;
