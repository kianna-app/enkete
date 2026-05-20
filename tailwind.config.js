/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          DEFAULT: "#25D366",
          dark: "#128C7E",
          bg: "#F0F2F5"
        }
      }
    }
  },
  plugins: []
};
