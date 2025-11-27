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
        // CERT Custom Color Palette
        cert: {
          brown: '#5f4033',
          'dark-blue': '#33436e',
          'dark-plum': '#471424',
          'light-blue': '#7ea0bf',
          'light-gray': '#c9d4d8',
          green: '#7b8f45',
        },

        // Brand color (Dark Blue)
        brand: {
          DEFAULT: '#33436e',
          hover: '#2a3759',
          active: '#222d4a',
          light: 'rgba(51, 67, 110, 0.1)',
          lighter: 'rgba(51, 67, 110, 0.06)',
        },

        // Light mode backgrounds
        background: {
          page: '#F6F9FC',
          surface: '#FFFFFF',
          subtle: '#c9d4d8',
          hover: '#b8c4c9',
        },

        // Dark mode backgrounds
        'background-dark': {
          page: '#0A0E14',
          surface: '#151B24',
          elevated: '#1D2530',
          hover: '#252D3A',
        },

        // Text hierarchy
        text: {
          primary: '#0A2540',
          secondary: '#596780',
          tertiary: '#8792A2',
        },

        // Status colors
        status: {
          success: '#7b8f45',
          'success-light': '#c9d4d8',
          'success-dark': '#5f7035',
          warning: '#F5A623',
          'warning-light': '#c9d4d8',
          'warning-dark': '#D68910',
          error: '#DF1B41',
          'error-light': '#c9d4d8',
          'error-dark': '#C41230',
          info: '#33436e',
          'info-light': '#c9d4d8',
          'info-dark': '#2a3759',
        },

        // Border colors (Dark Blue)
        border: {
          DEFAULT: '#33436e',
          light: 'rgba(51, 67, 110, 0.3)',
          dark: '#222d4a',
        },

        // Chart colors
        chart: {
          stroke: '#33436e',
          grid: '#c9d4d8',
        },
      },

      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Ubuntu', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', 'Droid Sans Mono', 'monospace'],
      },

      fontSize: {
        xs: ['11px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '20px' }],
        base: ['14px', { lineHeight: '20px' }],
        lg: ['15px', { lineHeight: '24px' }],
        xl: ['17px', { lineHeight: '28px' }],
        '2xl': ['20px', { lineHeight: '28px' }],
        '3xl': ['24px', { lineHeight: '32px' }],
        '4xl': ['28px', { lineHeight: '36px' }],
      },

      spacing: {
        'sidebar': '220px',
        'header': '52px',
      },

      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
        xl: '12px',
      },

      boxShadow: {
        card: '0 0 0 1px rgba(51, 67, 110, 0.1), 0 1px 2px rgba(51, 67, 110, 0.08)',
        elevated: '0 2px 5px rgba(51, 67, 110, 0.15), 0 1px 2px rgba(51, 67, 110, 0.1)',
        dropdown: '0 4px 12px rgba(51, 67, 110, 0.2), 0 1px 3px rgba(51, 67, 110, 0.12)',
        focus: '0 0 0 2px #FFFFFF, 0 0 0 4px #33436e',
        'focus-error': '0 0 0 2px #FFFFFF, 0 0 0 4px #DF1B41',
      },

      transitionDuration: {
        DEFAULT: '200ms',
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
