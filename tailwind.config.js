/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        serif: ["Lora", "Georgia", "serif"],
      },
      colors: {
        biblioteca: {
          plum: "#46343F",
          coral: "#D66F53",
          sage: "#DDE7DB",
          paper: "#F5F0E7",
          ink: "#29252B",
        },
      },
    },
  },
  plugins: [],
};