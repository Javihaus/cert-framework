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
        // Primary palette - Professional Blues
        primary: {
          900: '#0C121B',
          800: '#112358',
          700: '#004683',
          600: '#005A9E',
          500: '#1C70AD',
          400: '#3C6098',
          300: '#5B8BC9',
          200: '#8BB4DC',
          100: '#E8F0F8',
          50: '#F0F7FC',
        },
        // Accent - Coral for alerts
        accent: {
          600: '#D55A4F',
          500: '#E5756A',
          400: '#E48B59',
          300: '#EEA090',
          100: '#FEE8E6',
          50: '#FFF5F4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
