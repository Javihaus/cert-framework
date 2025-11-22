/**
 * CERT Dashboard Theme
 * Professional SaaS Dashboard Design System
 *
 * Centralized export for all design system tokens.
 * Import from '@/theme' to access colors, spacing, typography, and component tokens.
 *
 * @example
 * import { colors, spacing, typography, shadows, breakpoints } from '@/theme';
 *
 * <Box
 *   padding={spacing.lg}
 *   fontSize={typography.fontSize.lg}
 *   color={colors.text.primary}
 *   boxShadow={shadows.card}
 * />
 */

export { colors } from './colors';
export type { Colors, ColorKey } from './colors';

export {
  spacing,
  typography,
  borderRadius,
  radius,
  shadows,
  transitions,
  breakpoints,
  media,
  zIndex,
  componentTokens,
} from './tokens';

export type {
  Spacing,
  Typography,
  Shadows,
  BorderRadius,
  Breakpoints,
} from './tokens';

export { icons, iconSizes } from './icons';
