/**
 * CERT Dashboard Color Palette
 * Custom color scheme for EU AI Act compliance dashboard.
 */

export const colors = {
  // CERT Custom Color Palette
  cert: {
    brown: '#5f4033',
    darkBlue: '#33436e',
    darkPlum: '#471424',
    lightBlue: '#7ea0bf',
    lightGray: '#c9d4d8',
    green: '#7b8f45',
  },

  // Light Mode Backgrounds
  background: {
    page: '#F6F9FC',
    surface: '#FFFFFF',
    subtle: '#c9d4d8',       // Light gray
    hover: '#b8c4c9',
  },

  // Dark Mode Backgrounds
  backgroundDark: {
    page: '#0A0E14',
    surface: '#151B24',
    elevated: '#1D2530',
    hover: '#252D3A',
  },

  // Text Hierarchy
  text: {
    primary: '#0A2540',
    secondary: '#596780',
    tertiary: '#8792A2',
    inverse: '#FFFFFF',
    link: '#33436e',         // Dark Blue for links
    linkHover: '#2a3759',
  },

  // Brand Color (Dark Blue)
  brand: {
    DEFAULT: '#33436e',
    hover: '#2a3759',
    active: '#222d4a',
    light: 'rgba(51, 67, 110, 0.1)',
    lighter: 'rgba(51, 67, 110, 0.06)',
  },

  // Status Colors (Semantic)
  status: {
    success: '#7b8f45',      // Green from palette
    successLight: '#c9d4d8',
    successDark: '#5f7035',
    warning: '#F5A623',
    warningLight: '#c9d4d8',
    warningDark: '#D68910',
    error: '#DF1B41',
    errorLight: '#c9d4d8',
    errorDark: '#C41230',
    info: '#33436e',         // Dark Blue
    infoLight: '#c9d4d8',
    infoDark: '#2a3759',
  },

  // Neutral Palette
  neutral: {
    50: '#F6F9FC',
    100: '#c9d4d8',          // Light gray
    200: '#b8c4c9',
    300: '#a5b1b6',
    400: '#8792A2',
    500: '#596780',
    600: '#33436e',          // Dark Blue
    700: '#2a3759',
    800: '#1D2530',
    900: '#151B24',
    950: '#0A0E14',
  },

  // Border Colors (Dark Blue)
  border: {
    default: '#33436e',
    light: 'rgba(51, 67, 110, 0.3)',
    dark: '#222d4a',
    focus: '#33436e',
  },

  // Primary palette for gradients/variations
  primary: {
    50: '#c9d4d8',
    100: '#b8c4c9',
    200: '#a5b1b6',
    300: '#7ea0bf',
    400: '#5a7a9e',
    500: '#33436e',          // Base Dark Blue
    600: '#2a3759',
    700: '#222d4a',
    800: '#1a233b',
    900: '#12192c',
  },

  semantic: {
    success: '#7b8f45',
    successLight: '#c9d4d8',
    successDark: '#5f7035',
    warning: '#F5A623',
    warningLight: '#c9d4d8',
    warningDark: '#D68910',
    error: '#DF1B41',
    errorLight: '#c9d4d8',
    errorDark: '#C41230',
    info: '#33436e',
    infoLight: '#c9d4d8',
    infoDark: '#2a3759',
  },

  // Chart colors
  chart: {
    stroke: '#33436e',
    fill: 'rgba(51, 67, 110, 0.1)',
    grid: '#c9d4d8',
  },

  // Icon Colors - Dark Blue for all icons
  icon: {
    default: '#33436e',      // Dark Blue for all icons
    hover: '#2a3759',
    active: '#222d4a',
    muted: '#596780',
  },
} as const;

// Type exports for TypeScript
export type Colors = typeof colors;
export type ColorKey = keyof typeof colors;
