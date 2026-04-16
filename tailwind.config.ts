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
        // Fuel Rush Brand Colors (from UX_DESIGN.md)
        primary: {
          DEFAULT: "#FF6B35",
          light: "#FF8A5C",
          dark: "#E55A28",
        },
        secondary: {
          DEFAULT: "#1A1A2E",
          light: "#2A2A4E",
          dark: "#0A0A1E",
        },
        accent: {
          DEFAULT: "#00D4FF",
          light: "#33DDFF",
          dark: "#00A8CC",
        },
        // Status Colors
        success: "#00E676",
        warning: "#FFB300",
        danger: "#FF1744",
        neutral: "#A0A0A0",
        // Backgrounds
        background: "#0D0D0D",
        surface: "#1E1E2E",
        "surface-elevated": "#2A2A3E",
        // Text
        "text-primary": "#FFFFFF",
        "text-secondary": "#A0A0A0",
        "text-muted": "#666677",
        // Borders
        border: "#2E2E3E",
        "border-focus": "#00D4FF",
        // Status badges
        "status-available": "#00E676",
        "status-low": "#FFB300",
        "status-queue": "#FF6B35",
        "status-empty": "#FF1744",
        "status-unknown": "#A0A0A0",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["Poppins", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
      },
      borderRadius: {
        "card": "16px",
        "btn": "12px",
      },
      animation: {
        "pulse-slow": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 200ms ease-out",
        "slide-up": "slideUp 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        "bounce-in": "bounceIn 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "spin-slow": "spin 2s linear infinite",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        bounceIn: {
          "0%": { transform: "scale(0)", opacity: "0" },
          "50%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(255, 107, 53, 0.5)" },
          "70%": { boxShadow: "0 0 0 12px rgba(255, 107, 53, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(255, 107, 53, 0)" },
        },
      },
      boxShadow: {
        "glow-orange": "0 0 20px rgba(255, 107, 53, 0.4)",
        "glow-blue": "0 0 20px rgba(0, 212, 255, 0.4)",
        "glow-green": "0 0 20px rgba(0, 230, 118, 0.4)",
        "glow-red": "0 0 20px rgba(255, 23, 68, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
