import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#0B1F3B",
          accent:  "#6366F1",   // indigo — distinct from WMS teal and TMS green
          warning: "#F59E0B",
          critical:"#EF4444",
          bg:      "#F8FAFC",
          card:    "#FFFFFF",
        },
      },
      boxShadow: {
        soft:  "0 4px 14px rgba(15, 23, 42, 0.08)",
        panel: "0 10px 30px rgba(11, 31, 59, 0.10)",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
