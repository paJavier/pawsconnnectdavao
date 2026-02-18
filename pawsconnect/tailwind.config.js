/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#C40C0C",
        accent: "#FF6500",
        secondary: "#CC561E",
        base: "#F6CE71",
      },
    },
  },
  plugins: [],
};
