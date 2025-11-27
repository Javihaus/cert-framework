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
        // Brand color (Stripe Purple)
        brand: {
          DEFAULT: '#635BFF',
          hover: '#5851DB',
          active: '#4B45C6',
          light: 'rgba(99, 91, 255, 0.1)',
          lighter: 'rgba(99, 91, 255, 0.06)',
        },

        // Light mode backgrounds (Stripe-style)
        background: {
          page: '#F6F9FC',
          surface: '#FFFFFF',
          subtle: '#F0F3F7',
          hover: '#EDF1F7',
        },

        // Dark mode backgrounds
        'background-dark': {
          page: '#0A0E14',
          surface: '#151B24',
          elevated: '#1D2530',
          hover: '#252D3A',
        },

        // Text hierarchy (Stripe-style)
        text: {
          primary: '#0A2540',
          secondary: '#596780',
          tertiary: '#8792A2',
        },

        // Status colors
        status: {
          success: '#30B130',
          'success-light': '#D4EDDA',
          'success-dark': '#228B22',
          warning: '#F5A623',
          'warning-light': '#FFF3CD',
          'warning-dark': '#D68910',
          error: '#DF1B41',
          'error-light': '#FDECEA',
          'error-dark': '#C41230',
          info: '#0570DE',
          'info-light': '#E3F2FD',
          'info-dark': '#0455B2',
        },

        // Border colors (Stripe-style)
        border: {
          DEFAULT: '#E3E8EE',
          light: '#EDF1F7',
          dark: '#C1C9D2',
        },

        // Chart colors
        chart: {
          stroke: '#635BFF',
          grid: '#EDF1F7',
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
        card: '0 0 0 1px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.04)',
        elevated: '0 2px 5px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.05)',
        dropdown: '0 4px 12px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08)',
        focus: '0 0 0 2px #FFFFFF, 0 0 0 4px #635BFF',
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
