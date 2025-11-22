/**
 * CERT Dashboard Color Palette
 * Professional Design System based on DASHBOARD_DESIGN_SPEC.md
 *
 * Unified color system for EU AI Act compliance dashboard.
 */

export const colors = {
  // Light Mode Backgrounds
  background: {
    page: '#FAFAFA',
    surface: '#FFFFFF',
    subtle: '#F4F4F5',
  },

  // Dark Mode Backgrounds
  backgroundDark: {
    page: '#09090B',
    surface: '#18181B',
    elevated: '#27272A',
  },

  // Text Hierarchy
  text: {
    primary: '#09090B',
    secondary: '#71717A',
    tertiary: '#A1A1AA',
    inverse: '#FFFFFF',
    link: '#2563EB',
    linkHover: '#1D4ED8',
  },

  // Brand Color
  brand: {
    DEFAULT: '#2563EB',
    hover: '#1D4ED8',
    active: '#1E40AF',
    light: 'rgba(37, 99, 235, 0.1)',
  },

  // Status Colors (Semantic)
  status: {
    success: '#10B981',
    successLight: '#D1FAE5',
    successDark: '#059669',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    warningDark: '#D97706',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    errorDark: '#DC2626',
    info: '#3B82F6',
    infoLight: '#DBEAFE',
    infoDark: '#2563EB',
  },

  // Neutral Palette
  neutral: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
    950: '#09090B',
  },

  // Border Colors
  border: {
    default: '#E4E4E7',
    light: '#F4F4F5',
    dark: '#D4D4D8',
    focus: '#2563EB',
  },

  // Legacy aliases for backward compatibility
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  semantic: {
    success: '#10B981',
    successLight: '#D1FAE5',
    successDark: '#059669',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    warningDark: '#D97706',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    errorDark: '#DC2626',
    info: '#3B82F6',
    infoLight: '#DBEAFE',
    infoDark: '#2563EB',
  },

  // Chart colors
  chart: {
    stroke: '#2563EB',
    fill: 'rgba(37, 99, 235, 0.1)',
    grid: '#F4F4F5',
  },
} as const;

// Type exports for TypeScript
export type Colors = typeof colors;
export type ColorKey = keyof typeof colors;
