/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0F2B3C",
        teal: { DEFAULT: "#0E6655", dark: "#0a4d40" },
        emerald: "#1A8C6E",
        mint: "#A8D8C8",
        gold: { DEFAULT: "#B8860B", soft: "#D4A843" },
        ink: "#2C3E50",
        muted: "#7F8C8D",
        line: "#E8EDEB",
        surface: "#F7F9F8",
        canvas: "#EDF2EF",
        warning: "#F39C12",
        danger: "#E74C3C",
        info: "#3498DB",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        serif: ["Georgia", "Times New Roman", "serif"],
      },
      boxShadow: {
        soft: "0 1px 3px rgba(15,43,60,0.06), 0 1px 2px rgba(15,43,60,0.04)",
        ring: "0 0 0 2px rgba(14,102,85,0.15)",
        card: "0 4px 14px rgba(15,43,60,0.06)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
