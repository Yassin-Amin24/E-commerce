/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bootstrap 5 standard palette
        primary: {
          DEFAULT: '#0d6efd',
          hover: '#0b5ed7',
        },
        secondary: {
          DEFAULT: '#6c757d',
          hover: '#5c636a',
        },
        success: {
          DEFAULT: '#198754',
          hover: '#157347',
        },
        danger: {
          DEFAULT: '#dc3545',
          hover: '#bb2d3b',
        },
        warning: {
          DEFAULT: '#ffc107',
          hover: '#ffca2c',
        },
        info: {
          DEFAULT: '#0dcaf0',
          hover: '#3dd5f3',
        },
        light: {
          DEFAULT: '#f8f9fa',
          hover: '#f9fafb',
        },
        dark: {
          DEFAULT: '#212529',
          hover: '#1c1f23',
        },
      },
      fontFamily: {
        sans: [
          'system-ui', '-apple-system', '"Segoe UI"', 
          'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif',
          '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"'
        ],
      }
    },
  },
  plugins: [],
}
