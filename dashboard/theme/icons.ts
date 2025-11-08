/**
 * CERT Icon System - Using Lucide Icons
 * Professional, consistent, clean Swiss design
 *
 * WHY LUCIDE:
 * - Consistent 2px stroke width
 * - Clean, minimal style
 * - Professional appearance
 * - Used by Linear, Vercel, Stripe
 */

import {
  // Navigation
  Home,
  Upload,
  Menu,
  X,
  ArrowRight,
  ArrowLeft,

  // Monitoring
  LayoutDashboard,
  AlertTriangle,
  BarChart3,
  FileText,
  CheckCircle2,
  XCircle,
  Info,

  // Files
  File,
  Download,
  FolderOpen,

  // Status
  Lock,
  Shield,
  Zap,
  Eye,
  EyeOff,

} from 'lucide-react';

export const icons = {
  // Navigation
  home: Home,
  upload: Upload,
  menu: Menu,
  close: X,
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,

  // Monitoring
  dashboard: LayoutDashboard,
  warning: AlertTriangle,
  chart: BarChart3,
  document: FileText,

  // Status
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  lock: Lock,
  shield: Shield,
  zap: Zap,

  // Files
  file: File,
  download: Download,
  folder: FolderOpen,

  // UI
  eye: Eye,
  eyeOff: EyeOff,
} as const;

// Icon sizes - smaller, more refined
export const iconSizes = {
  xs: 14,   // Very small inline icons
  sm: 16,   // Standard inline icons
  md: 20,   // Card/section icons
  lg: 24,   // Feature/heading icons
  xl: 32,   // Hero/large display icons
} as const;
