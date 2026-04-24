/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx,html}"],
  theme: {
    extend: {
      colors: {
        ink: "#202124",
        line: "#d9dedb",
        paper: "#f8f7f3",
        teal: "#23766b",
        rust: "#a4512f",
      },
    },
  },
  plugins: [],
};
