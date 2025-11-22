import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand color
        brand: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          active: '#1E40AF',
          light: 'rgba(37, 99, 235, 0.1)',
        },

        // Light mode backgrounds
        background: {
          page: '#FAFAFA',
          surface: '#FFFFFF',
          subtle: '#F4F4F5',
        },

        // Dark mode backgrounds
        'background-dark': {
          page: '#09090B',
          surface: '#18181B',
          elevated: '#27272A',
        },

        // Text hierarchy
        text: {
          primary: '#09090B',
          secondary: '#71717A',
          tertiary: '#A1A1AA',
        },

        // Status colors
        status: {
          success: '#10B981',
          'success-light': '#D1FAE5',
          'success-dark': '#059669',
          warning: '#F59E0B',
          'warning-light': '#FEF3C7',
          'warning-dark': '#D97706',
          error: '#EF4444',
          'error-light': '#FEE2E2',
          'error-dark': '#DC2626',
          info: '#3B82F6',
          'info-light': '#DBEAFE',
          'info-dark': '#2563EB',
        },

        // Border colors
        border: {
          DEFAULT: '#E4E4E7',
          light: '#F4F4F5',
          dark: '#D4D4D8',
        },

        // Chart colors
        chart: {
          stroke: '#2563EB',
          grid: '#F4F4F5',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Monaco', 'monospace'],
      },

      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '20px' }],
        base: ['14px', { lineHeight: '20px' }],
        lg: ['16px', { lineHeight: '24px' }],
        xl: ['18px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
      },

      spacing: {
        'sidebar': '240px',
        'header': '56px',
      },

      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
        xl: '12px',
      },

      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        elevated: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        focus: '0 0 0 2px #FFFFFF, 0 0 0 4px #2563EB',
        'focus-error': '0 0 0 2px #FFFFFF, 0 0 0 4px #EF4444',
      },

      transitionDuration: {
        DEFAULT: '150ms',
      },

      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
