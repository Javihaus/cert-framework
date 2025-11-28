/**
 * CERT Icon System - Using react-icons/lu
 * Professional, consistent, clean Swiss design
 *
 * WHY react-icons/lu:
 * - Consistent 2px stroke width
 * - Clean, minimal style
 * - Professional appearance
 * - Used by Linear, Vercel, Stripe
 */

import {
  // Navigation
  LuHouse,
  LuUpload,
  LuMenu,
  LuX,
  LuArrowRight,
  LuArrowLeft,

  // Monitoring
  LuLayoutDashboard,
  LuTriangleAlert,
  LuChartBar,
  LuFileText,
  LuCircleCheckBig,
  LuCircleX,
  LuInfo,

  // Files
  LuFile,
  LuDownload,
  LuFolderOpen,

  // Status
  LuLock,
  LuShield,
  LuRepeat2,
  LuEye,
  LuEyeOff,

} from 'react-icons/lu';

export const icons = {
  // Navigation
  home: LuHouse,
  upload: LuUpload,
  menu: LuMenu,
  close: LuX,
  arrowRight: LuArrowRight,
  arrowLeft: LuArrowLeft,

  // Monitoring
  dashboard: LuLayoutDashboard,
  warning: LuTriangleAlert,
  chart: LuChartBar,
  document: LuFileText,

  // Status
  success: LuCircleCheckBig,
  error: LuCircleX,
  info: LuInfo,
  lock: LuLock,
  shield: LuShield,
  zap: LuRepeat2,

  // Files
  file: LuFile,
  download: LuDownload,
  folder: LuFolderOpen,

  // UI
  eye: LuEye,
  eyeOff: LuEyeOff,
} as const;

// Icon sizes - smaller, more refined
export const iconSizes = {
  xs: 14,   // Very small inline icons
  sm: 16,   // Standard inline icons
  md: 20,   // Card/section icons
  lg: 24,   // Feature/heading icons
  xl: 32,   // Hero/large display icons
} as const;
