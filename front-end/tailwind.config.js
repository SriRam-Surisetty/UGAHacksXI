/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'primary-purple': '#341755',
        'light-purple': '#eaeaf4',
        'black': '#000000',
        'white': '#ffffff',
        'accent-purple': '#6b3fa0',
        'soft-purple': '#f5f3f7',
      },
      fontFamily: {
        'sans': ['IBM Plex Sans', 'sans-serif'],
        'display': ['Space Grotesk', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
