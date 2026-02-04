/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        rose: { DEFAULT: '#C8509B', light: '#d875a8', dark: '#a83d7e', glow: 'rgba(200,80,155,0.25)' },
        bg: { DEFAULT: '#0a0a0a', card: '#141414', input: '#1a1a1a', hover: '#1e1e1e' },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
