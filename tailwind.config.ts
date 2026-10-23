import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#25221f",
        cream: "#fbf8f2",
        sand: "#eee5d7",
        wine: { DEFAULT: "#722f37", dark: "#4d1f27", light: "#f4e8e8" },
        gold: { DEFAULT: "#b38a4a", light: "#dbc49c" },
        sage: "#5e6b5a",
      },
      fontFamily: {
        sans: ["Manrope Variable", "Manrope", "sans-serif"],
        display: ["Cormorant Garamond", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 20px 60px -30px rgba(55, 35, 25, .28)",
        card: "0 12px 40px -20px rgba(55, 35, 25, .2)",
      },
      backgroundImage: {
        grain: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.15'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(22px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "slow-zoom": { "0%": { opacity: "0", transform: "scale(1.04)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
      },
      animation: {
        "fade-up": "fade-up .8s cubic-bezier(.2,.7,.2,1) both",
        "slow-zoom": "slow-zoom 1.4s cubic-bezier(.2,.7,.2,1) both",
        marquee: "marquee 28s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
