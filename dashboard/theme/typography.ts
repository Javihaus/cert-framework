/**
 * Typography System
 * Consistent font styles across the CERT Dashboard
 */

export const typography = {
  // Page Titles (h1)
  pageTitle: {
    fontSize: '2rem', // 32px
    fontWeight: '700',
    lineHeight: '2.5rem',
    color: {
      light: '#18181b', // zinc-900
      dark: '#fafafa',  // zinc-50
    }
  },

  // Section Titles (h2)
  sectionTitle: {
    fontSize: '1.5rem', // 24px
    fontWeight: '600',
    lineHeight: '2rem',
    color: {
      light: '#18181b', // zinc-900
      dark: '#fafafa',  // zinc-50
    }
  },

  // Card Titles (h3)
  cardTitle: {
    fontSize: '1.25rem', // 20px
    fontWeight: '600',
    lineHeight: '1.75rem',
    color: {
      light: '#18181b', // zinc-900
      dark: '#fafafa',  // zinc-50
    }
  },

  // Subsection Titles (h4)
  subsectionTitle: {
    fontSize: '1.125rem', // 18px
    fontWeight: '600',
    lineHeight: '1.75rem',
    color: {
      light: '#18181b', // zinc-900
      dark: '#fafafa',  // zinc-50
    }
  },

  // Body Text
  body: {
    fontSize: '0.875rem', // 14px
    fontWeight: '400',
    lineHeight: '1.5rem',
    color: {
      light: '#3f3f46', // zinc-700
      dark: '#d4d4d8',  // zinc-300
    }
  },

  // Body Text Large
  bodyLarge: {
    fontSize: '1rem', // 16px
    fontWeight: '400',
    lineHeight: '1.75rem',
    color: {
      light: '#3f3f46', // zinc-700
      dark: '#d4d4d8',  // zinc-300
    }
  },

  // Body Text Small
  bodySmall: {
    fontSize: '0.75rem', // 12px
    fontWeight: '400',
    lineHeight: '1.25rem',
    color: {
      light: '#52525b', // zinc-600
      dark: '#a1a1aa',  // zinc-400
    }
  },

  // Labels
  label: {
    fontSize: '0.875rem', // 14px
    fontWeight: '500',
    lineHeight: '1.25rem',
    color: {
      light: '#18181b', // zinc-900
      dark: '#fafafa',  // zinc-50
    }
  },

  // Caption/Helper Text
  caption: {
    fontSize: '0.75rem', // 12px
    fontWeight: '400',
    lineHeight: '1rem',
    color: {
      light: '#71717a', // zinc-500
      dark: '#a1a1aa',  // zinc-400
    }
  },

  // Buttons
  button: {
    fontSize: '0.875rem', // 14px
    fontWeight: '500',
    lineHeight: '1.25rem',
  },

  // Navigation Items
  navItem: {
    fontSize: '0.875rem', // 14px
    fontWeight: '500',
    lineHeight: '1.25rem',
  },
} as const;

// Tailwind CSS utility classes for easy use
export const typographyClasses = {
  pageTitle: 'text-3xl font-bold text-zinc-900 dark:text-zinc-50',
  sectionTitle: 'text-2xl font-semibold text-zinc-900 dark:text-zinc-50',
  cardTitle: 'text-xl font-semibold text-zinc-900 dark:text-zinc-50',
  subsectionTitle: 'text-lg font-semibold text-zinc-900 dark:text-zinc-50',
  body: 'text-sm text-zinc-700 dark:text-zinc-300',
  bodyLarge: 'text-base text-zinc-700 dark:text-zinc-300',
  bodySmall: 'text-xs text-zinc-600 dark:text-zinc-400',
  label: 'text-sm font-medium text-zinc-900 dark:text-zinc-50',
  caption: 'text-xs text-zinc-500 dark:text-zinc-400',
  button: 'text-sm font-medium',
  navItem: 'text-sm font-medium',
} as const;
