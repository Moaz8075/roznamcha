/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0B3D2E',
          dark: '#072A20',
          muted: '#E8F2EE',
        },
      },
    },
  },
  plugins: [],
};
