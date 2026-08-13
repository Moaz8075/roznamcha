/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#F15A24',
          dark: '#D84315',
          light: '#FF7A45',
          muted: '#FFE8DE',
        },
        ink: '#212121',
        paper: '#F4F4F4',
        danger: '#E53935',
        success: '#2E7D32',
        warn: '#F6C445',
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
