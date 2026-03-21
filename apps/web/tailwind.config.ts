import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
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
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
