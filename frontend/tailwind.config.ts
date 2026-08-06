import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))", background: "hsl(var(--background))", foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "#4F46E5", hover: "#4338CA", light: "#EEF2FF", dark: "#3730A3", foreground: "#fff" },
        accent: { DEFAULT: "#F97316", hover: "#EA6C0A", light: "#FFF7ED" },
        success: "#059669", warning: "#D97706", danger: "#DC2626",
      },
      borderRadius: { xs: "0.25rem", sm: "0.375rem", md: "0.5rem", lg: "0.75rem", xl: "1rem", "2xl": "1.25rem" },
      fontFamily: { sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"], mono: ["JetBrains Mono", "monospace"] },
    },
  },
  plugins: [],
};
export default config;
