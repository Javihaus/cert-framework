/**
 * CERT Icon System
 * Centralized icon definitions using react-icons
 * NEVER use emojis - always use these professional icons
 */

import {
  // Navigation & Actions
  MdHome,
  MdUpload,
  MdMenu,
  MdClose,
  MdArrowForward,
  MdArrowBack,

  // Monitoring Section
  MdDashboard,
  MdWarning,
  MdBarChart,
  MdDescription,
  MdCheckCircle,
  MdError,
  MdInfo,
  MdCancel,
  MdAssessment,
  MdList,

  // Data & Files
  MdFileUpload,
  MdFileDownload,
  MdInsertDriveFile,
  MdFolder,
  MdFolderZip,

  // Status & Feedback
  MdLock,
  MdVisibility,
  MdVisibilityOff,
  MdSecurity,
  MdSpeed,
  MdVerifiedUser,

  // UI Controls
  MdExpandMore,
  MdExpandLess,
  MdSearch,
  MdFilterList,

} from 'react-icons/md';

export const icons = {
  // Main Navigation
  home: MdHome,
  menu: MdMenu,
  close: MdClose,

  // Monitoring Navigation
  upload: MdUpload,
  dashboard: MdDashboard,
  warning: MdWarning,
  chart: MdBarChart,
  document: MdDescription,

  // Status
  success: MdCheckCircle,
  error: MdError,
  cancel: MdCancel,
  info: MdInfo,
  lock: MdLock,
  assessment: MdAssessment,
  list: MdList,

  // File Operations
  fileUpload: MdFileUpload,
  fileDownload: MdFileDownload,
  file: MdInsertDriveFile,
  folder: MdFolder,
  folderZip: MdFolderZip,

  // Features
  security: MdSecurity,
  speed: MdSpeed,
  verified: MdVerifiedUser,

  // UI
  expandMore: MdExpandMore,
  expandLess: MdExpandLess,
  search: MdSearch,
  filter: MdFilterList,
  arrowForward: MdArrowForward,
  arrowBack: MdArrowBack,
  visibility: MdVisibility,
  visibilityOff: MdVisibilityOff,
} as const;

// Icon sizes (consistent across app)
export const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
} as const;
