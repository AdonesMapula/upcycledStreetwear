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
          DEFAULT: '#135918',
          light: '#a8c3a0',
        },
        secondary: {
          DEFAULT: '#333333',
        },
        cream: '#fffcf0',
      },
    },
  },
  plugins: [],
}
