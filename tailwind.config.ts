import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        base: "#f5f7fb",
        card: "#ffffff",
        ink: "#141b2d",
        accent: "#0b7285",
        soft: "#dbe5ff"
      }
    }
  },
  plugins: []
};

export default config;

