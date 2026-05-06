/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        hsj: {
          teal: '#39A8AD',
          'teal-dark': '#00666B',
          navy: '#003339',
          bg: '#F7F7F8',
        },
      },
    },
  },
  plugins: [],
}
