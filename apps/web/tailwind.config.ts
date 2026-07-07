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
          pink: "#FF2A85",
          cyan: "#00F0FF",
          purple: "#8A2BE2",
          dark: "#0A0A0F",
          darker: "#05050A",
          green: "#53FC18",
          gold: "#FFD700",
          red: "#FF3B3B",
          glass: "rgba(255,255,255,0.03)",
          "glass-dark": "rgba(5,5,10,0.65)",
          "glass-border": "rgba(138,43,226,0.18)",
        },
      },
      fontFamily: {
        display: ["Outfit","sans-serif"],
        graffiti: ["'Permanent Marker'","cursive"],
        outfit: ["'Outfit'","sans-serif"],
        mono: ["ui-monospace","SFMono-Regular","Menlo","Monaco","Consolas","monospace"],
      },
      boxShadow: {
        "neon-pink": "0 0 12px rgba(255,42,133,0.35)",
        "neon-cyan": "0 0 12px rgba(0,240,255,0.3)",
        "neon-purple": "0 0 12px rgba(138,43,226,0.25)",
        "glow-ring": "0 0 0 2px #00F0FF, 0 0 14px rgba(0,240,255,0.4)",
      },
      keyframes: {
        "fade-in": { "0%": { opacity: "0", transform: "translateY(6px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "slide-up": { "0%": { opacity: "0", transform: "translateY(20px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "scale-in": { "0%": { opacity: "0", transform: "scale(0.9)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        float: { "0%, 100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-8px)" } },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 5px rgba(255,42,133,0.3), 0 0 10px rgba(255,42,133,0.1)" },
          "50%": { boxShadow: "0 0 15px rgba(255,42,133,0.5), 0 0 30px rgba(255,42,133,0.2)" },
        },
        "progress-fill": { "0%": { width: "0%" }, "100%": { width: "100%" } },
        "glow-spin": {
          "0%": { boxShadow: "0 0 8px rgba(0,240,255,0.3), 0 0 18px rgba(0,240,255,0.1)" },
          "50%": { boxShadow: "0 0 16px rgba(255,42,133,0.45), 0 0 28px rgba(255,42,133,0.15)" },
          "100%": { boxShadow: "0 0 8px rgba(0,240,255,0.3), 0 0 18px rgba(0,240,255,0.1)" },
        },
        sheen: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        tilt: { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(-1.5deg)" } },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out forwards",
        "slide-up": "slide-up 0.5s cubic-bezier(0.4,0,0.2,1) forwards",
        "scale-in": "scale-in 0.3s cubic-bezier(0.4,0,0.2,1) forwards",
        shimmer: "shimmer 2s infinite",
        float: "float 4s ease-in-out infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "progress-fill": "progress-fill 12s linear forwards",
        "glow-spin": "glow-spin 3s linear infinite",
        sheen: "sheen 2.2s linear infinite",
        tilt: "tilt 0.25s ease-out forwards",
        "pulse-fast": "pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite",
      },
      backdropBlur: { xs: "2px" },
      transitionProperty: { height: "height", width: "width", colors: "color, background-color, border-color" },
    },
  },
  plugins: [],
};

export default config;

/* Extra pop in fire/grok modes */
.grok-fire-mode .emoji img,
.grok-fire-mode img.emoji,
.fuego-msg .emoji img,
.fuego-msg img.emoji {
  filter: drop-shadow(0 0 6px #ff4500) saturate(1.3) brightness(1.1);
}

/* Kick love styles */
.kick-badge, .kick-element { color: #53fc18; }
.kick-element .emoji img { filter: drop-shadow(0 0 3px #53fc18); }

/* Tweak sizes per context */
.chat-message .emoji img,
.chat-message img.emoji { width: 1.15em; height: 1.15em; }

.rain-particle .emoji img { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); }

/* Emoji rain / shower */
@keyframes coinShower {
  0% { transform: translateY(-50px) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
}
.animate-coin-shower {
  animation-name: coinShower;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  will-change: transform, opacity;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
}

/* Stronger emoji in fire mode or highlights */
.grok-fire-mode .emoji,
.fuego-msg .emoji {
  filter: saturate(1.4) brightness(1.1);
  text-shadow: 0 0 8px currentColor;
}
