/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        linkedin: {
          DEFAULT: '#0a66c2',
          dark: '#004182',
        },
      },
    },
  },
  plugins: [],
};
