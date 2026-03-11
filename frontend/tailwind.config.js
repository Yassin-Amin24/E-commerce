/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4f46e5',
          hover: '#4338ca',
          light: '#ede9fe',
        },
        secondary: {
          DEFAULT: '#64748b',
          hover: '#475569',
        },
        success: {
          DEFAULT: '#059669',
          hover: '#047857',
          light: '#d1fae5',
        },
        danger: {
          DEFAULT: '#e11d48',
          hover: '#be123c',
          light: '#ffe4e6',
        },
        warning: {
          DEFAULT: '#d97706',
          hover: '#b45309',
        },
        dark: {
          DEFAULT: '#0f172a',
          hover: '#1e293b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in-down': 'fadeInDown 0.2s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
      },
      keyframes: {
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
