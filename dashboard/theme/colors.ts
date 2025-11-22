/**
 * CERT Dashboard Color Palette
 * Professional SaaS Dashboard Design System
 *
 * Based on Material Palette MP203 with enhancements for
 * €5K+ professional compliance monitoring dashboard.
 */

export const colors = {
  // Primary Palette - Professional Blues
  primary: {
    900: '#0C121B', // Midnight Edition - Primary text, headers
    800: '#112358', // Fibonacci Blue - Dark accents
    700: '#004683', // Bridgeport - Primary actions, buttons
    500: '#1C70AD', // Planetarium - Interactive elements
    400: '#3C6098', // Bright Cobalt - Links, secondary actions
    300: '#5B8BC9', // Light cobalt - Hover states
    100: '#E8F0F8', // Very light blue - Backgrounds
  },

  // Neutrals - Clean & Professional
  neutral: {
    900: '#0C121B', // Midnight Edition - Headers, primary text
    800: '#1F2937', // Dark gray - Secondary text
    700: '#374151', // Gray - Muted text
    600: '#4B5563', // Medium gray
    500: '#6B7280', // Gray
    400: '#9CA3AF', // Porpoise Fin - Borders, muted text
    300: '#C8CBCD', // Light gray - Dividers
    200: '#E5E7EB', // Very light gray
    100: '#F2F3F4', // Anti-Flash White - Backgrounds
    50: '#F9FAFB', // Near white
  },

  // Accent - Coral for Alerts & CTAs
  accent: {
    600: '#D55A4F', // Dark coral
    500: '#E5756A', // Ardent Coral - Alerts, CTAs, warnings
    400: '#E48B59', // Aegean Sky - Warm accent
    300: '#EEA090', // Light coral
    100: '#FEE8E6', // Very light coral - Alert backgrounds
    50: '#FFF5F4', // Near white coral
  },

  // Semantic Colors - Clear Status Indicators
  semantic: {
    success: '#10B981', // Emerald green
    successLight: '#D1FAE5',
    successDark: '#059669',
    warning: '#F59E0B', // Amber
    warningLight: '#FEF3C7',
    warningDark: '#D97706',
    error: '#E5756A', // Using Ardent Coral for consistency
    errorLight: '#FEE8E6',
    errorDark: '#D55A4F',
    info: '#1C70AD', // Using Planetarium
    infoLight: '#E8F0F8',
    infoDark: '#004683',
  },

  // Functional Surfaces
  background: '#FFFFFF',
  surface: '#F2F3F4', // Anti-Flash White
  surfaceHover: '#E5E7EB',
  surfaceActive: '#D1D5DB',

  // Text Colors
  text: {
    primary: '#0C121B', // Midnight Edition
    secondary: '#374151', // Dark gray
    muted: '#6B7280', // Gray
    disabled: '#9CA3AF', // Light gray
    inverse: '#FFFFFF',
    link: '#1C70AD', // Planetarium
    linkHover: '#004683', // Bridgeport
  },

  // Border Colors
  border: {
    default: '#E5E7EB',
    light: '#F2F3F4',
    dark: '#D1D5DB',
    focus: '#1C70AD',
  },

  // Status Banner Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #004683 0%, #1C70AD 100%)',
    compliant: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    warning: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    error: 'linear-gradient(135deg, #E5756A 0%, #D55A4F 100%)',
    info: 'linear-gradient(135deg, #1C70AD 0%, #004683 100%)',
  },

  // Legacy aliases for backward compatibility
  cobalt: '#3C6098',
  navy: '#112358',
  coral: '#E48B59',
  patience: '#E6DDD6',
  mist: '#BFC8D8',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#E5756A',
  olive: '#10B981',
  gold: '#F59E0B',
  alert: '#E5756A',
  gray: '#6B7280',
} as const;

// Type exports for TypeScript
export type Colors = typeof colors;
export type ColorKey = keyof typeof colors;
