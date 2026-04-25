/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          500: '#6366f1',
          600: '#4f46e5',
          900: '#312e81',
        },
        dark: {
          main: '#0f111a',
          sidebar: '#171a25',
          bubble: '#1e2233'
        }
      }
    },
  },
  plugins: [],
}
