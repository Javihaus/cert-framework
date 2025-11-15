/**
 * CERT Dashboard Color Palette
 * Source: Material Palette MP203
 */

export const colors = {
  // Primary Colors
  cobalt: '#3C6098',        // Bright Cobalt - Primary brand color
  navy: '#112358',          // Fibonacci Blue - Dark accents
  coral: '#E48B59',         // Aegean Sky - Warning/accent

  // Neutrals
  background: '#FBF5F0',    // Silver Bird - Main background
  patience: '#E6DDD6',      // Patience - Light gray
  mist: '#BFC8D8',          // Dancing Mist - Light blue gray

  // Semantic Colors
  success: '#48bb78',       // Green for passed
  warning: '#E48B59',       // Coral for warnings
  error: '#fc8181',         // Red for failures

  // Color Aliases (for backward compatibility)
  olive: '#48bb78',         // Alias for success green
  gold: '#E48B59',          // Alias for warning/coral
  alert: '#fc8181',         // Alias for error red

  // Text
  text: {
    primary: '#112358',     // Fibonacci Blue
    secondary: '#3C6098',   // Bright Cobalt
    muted: '#718096',       // Gray
  },

  // Status Banner Gradients
  gradients: {
    compliant: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
    warning: 'linear-gradient(135deg, #E48B59 0%, #dd6b20 100%)',
    error: 'linear-gradient(135deg, #fc8181 0%, #f56565 100%)',
    primary: 'linear-gradient(135deg, #3C6098 0%, #2c4a70 100%)',
  }
};
