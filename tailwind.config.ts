import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "tabloid-red": "#c1121f",
        "tabloid-dark-red": "#9b111e",
        "tabloid-accent-red": "#e11d2e",
        "tabloid-black": "#111111",
        "tabloid-dark": "#2b2b2b",
        "tabloid-border": "#e5e5e5",
      },
      fontFamily: {
        headline: ['"Georgia"', '"Times New Roman"', 'serif'],
        body: ['"Arial"', '"Helvetica Neue"', 'sans-serif'],
        condensed: ['"Arial Narrow"', '"Arial"', 'sans-serif'],
      },
      animation: {
        ticker: "ticker 30s linear infinite",
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
