import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // LoveChain palette — warm rose on a deep ink background.
        rose: {
          50: "#fff1f4",
          100: "#ffe0e7",
          400: "#fb7093",
          500: "#f43f6b",
          600: "#e11d54",
        },
        ink: {
          900: "#140b18",
          800: "#1e1224",
          700: "#2a1a33",
          600: "#3a2545",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
