/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        hsj: {
          bay: '#1A3A6B',
          pal: '#4A7FC1',
          bg: '#F8F9FC',
          surface: '#FFFFFF',
          sunken: '#F1F3F8',
          slate: '#6B7280',
          'pale-slate': '#E5E7EB',
          red: '#EF5350', green: '#8BC34A', teal: '#26A69A',
          yellow: '#E8C547', purple: '#AB47BC',
          'success-fg': '#558B2F', 'warning-fg': '#8D6E00',
          'danger-fg': '#C62828', 'info-fg': '#4A7FC1',
        },
      },
    },
  },
  plugins: [],
}
