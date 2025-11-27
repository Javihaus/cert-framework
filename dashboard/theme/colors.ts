/**
 * CERT Dashboard Color Palette
 * Design System based on Stripe Dashboard UI
 *
 * Unified color system for EU AI Act compliance dashboard.
 */

export const colors = {
  // Light Mode Backgrounds (Stripe-style)
  background: {
    page: '#F6F9FC',        // Stripe's page background
    surface: '#FFFFFF',      // Cards, panels
    subtle: '#F0F3F7',       // Subtle backgrounds
    hover: '#EDF1F7',        // Hover states
  },

  // Dark Mode Backgrounds (Enhanced for readability)
  backgroundDark: {
    page: '#0A0E14',         // Deep dark background
    surface: '#151B24',      // Card surfaces
    elevated: '#1D2530',     // Elevated elements
    hover: '#252D3A',        // Hover states
  },

  // Text Hierarchy (Stripe-style)
  text: {
    primary: '#0A2540',      // Stripe's primary dark navy
    secondary: '#596780',    // Secondary text
    tertiary: '#8792A2',     // Muted text
    inverse: '#FFFFFF',      // Text on dark backgrounds
    link: '#635BFF',         // Stripe purple for links
    linkHover: '#5851DB',    // Darker on hover
  },

  // Brand Color (Stripe Purple)
  brand: {
    DEFAULT: '#635BFF',      // Stripe's signature purple
    hover: '#5851DB',
    active: '#4B45C6',
    light: 'rgba(99, 91, 255, 0.1)',
    lighter: 'rgba(99, 91, 255, 0.06)',
  },

  // Status Colors (Semantic)
  status: {
    success: '#30B130',      // Green
    successLight: '#D4EDDA',
    successDark: '#228B22',
    warning: '#F5A623',      // Amber
    warningLight: '#FFF3CD',
    warningDark: '#D68910',
    error: '#DF1B41',        // Stripe's danger red
    errorLight: '#FDECEA',
    errorDark: '#C41230',
    info: '#0570DE',         // Stripe's info blue
    infoLight: '#E3F2FD',
    infoDark: '#0455B2',
  },

  // Neutral Palette (Stripe-aligned)
  neutral: {
    50: '#F6F9FC',
    100: '#EDF1F7',
    200: '#E3E8EE',
    300: '#C1C9D2',
    400: '#8792A2',
    500: '#596780',
    600: '#425166',
    700: '#30405A',
    800: '#1D2530',
    900: '#151B24',
    950: '#0A0E14',
  },

  // Border Colors (Stripe-style subtle)
  border: {
    default: '#E3E8EE',      // Main borders
    light: '#EDF1F7',        // Subtle borders
    dark: '#C1C9D2',         // Emphasized borders
    focus: '#635BFF',        // Focus ring
  },

  // Primary palette for gradients/variations
  primary: {
    50: '#F5F4FF',
    100: '#EBEBFF',
    200: '#D4D2FF',
    300: '#B5B1FF',
    400: '#8F89FF',
    500: '#635BFF',          // Base
    600: '#5851DB',
    700: '#4B45C6',
    800: '#3D38A8',
    900: '#2F2B89',
  },

  semantic: {
    success: '#30B130',
    successLight: '#D4EDDA',
    successDark: '#228B22',
    warning: '#F5A623',
    warningLight: '#FFF3CD',
    warningDark: '#D68910',
    error: '#DF1B41',
    errorLight: '#FDECEA',
    errorDark: '#C41230',
    info: '#0570DE',
    infoLight: '#E3F2FD',
    infoDark: '#0455B2',
  },

  // Chart colors
  chart: {
    stroke: '#635BFF',
    fill: 'rgba(99, 91, 255, 0.1)',
    grid: '#EDF1F7',
  },

  // Icon Colors - Stripe-inspired with user's palette accents
  icon: {
    purple: '#635BFF',       // Primary actions, navigation active
    blue: '#0570DE',         // Info, links
    teal: '#3ECFA8',         // Success, monitoring
    orange: '#F5A623',       // Warnings, costs
    red: '#DF1B41',          // Errors, alerts
    navy: '#0A2540',         // Default icons
    gray: '#596780',         // Muted icons
    // Custom palette accents
    periwinkle: '#8B8BCD',   // From user's palette
    walnut: '#573129',       // From user's palette
  },
} as const;

// Type exports for TypeScript
export type Colors = typeof colors;
export type ColorKey = keyof typeof colors;
