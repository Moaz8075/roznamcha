/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0B3D2E',
          dark: '#072A20',
          light: '#145C45',
          muted: '#E8F2EE',
        },
        ink: '#12211B',
        paper: '#FBF9F3',
        danger: '#B42318',
        success: '#067647',
        warn: '#B54708',
      },
      fontSize: {
        'display': ['28px', { lineHeight: '34px', fontWeight: '700' }],
        'title': ['22px', { lineHeight: '28px', fontWeight: '700' }],
        'body-lg': ['18px', { lineHeight: '26px' }],
        'body': ['16px', { lineHeight: '24px' }],
      },
    },
  },
  plugins: [],
};
