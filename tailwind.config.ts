import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        wacke: {
          pink: "#FF1493",
          cyan: "#00FFFF",
          purple: "#8B00FF",
          dark: "#0A0A0F",
          darker: "#05050A",
        },
      },
      fontFamily: {
        graffiti: ["'Permanent Marker'", "cursive"],
      },
    },
  },
  plugins: [],
};

export default config;
