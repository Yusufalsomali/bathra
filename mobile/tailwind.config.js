/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#000000",
          foreground: "#ffffff",
          50: "#f8f8f8",
          100: "#f0f0f0",
          200: "#e0e0e0",
          300: "#c7c7c7",
          400: "#a0a0a0",
          500: "#737373",
          600: "#525252",
          700: "#3d3d3d",
          800: "#262626",
          900: "#171717",
          950: "#0a0a0a",
        },
        secondary: {
          DEFAULT: "#f1f5f9",
          foreground: "#000000",
        },
        accent: {
          DEFAULT: "#262626",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#ebebeb",
          foreground: "#666666",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        border: "#d9d9d9",
        input: "#d9d9d9",
        ring: "#000000",
        background: "#ffffff",
        foreground: "#000000",
        card: {
          DEFAULT: "#ffffff",
          foreground: "#000000",
        },
      },
      fontFamily: {
        sans: ["Sora_400Regular", "System"],
        sora: [
          "Sora_400Regular",
          "Sora_500Medium",
          "Sora_600SemiBold",
          "Sora_700Bold",
        ],
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "4px",
      },
    },
  },
  plugins: [],
};
