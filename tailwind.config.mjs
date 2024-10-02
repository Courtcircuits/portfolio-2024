/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    fontFamily: {
      mono: ["Micro5", "sans"],
    },
    colors: {
      accent: "var(--accent)",
      accentlight: "var(--accent-light)",
      secondary: "var(--secondary)",
      secondaryxlight: "var(--secondary-x-light)",
      secondarylight: "var(--secondary-light)",
      primary: "var(--primary)",
      white: "#fff",
    },
    extend: {},
  },
  plugins: [],
};
