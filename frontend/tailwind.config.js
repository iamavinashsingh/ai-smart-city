/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './index.html',
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        "on-primary-fixed-variant": "#6000bf",
        "on-surface": "#e5e1e4",
        "primary-container": "#6c1ecd",
        "inverse-surface": "#e5e1e4",
        "surface": "#131315",
        "tertiary-fixed-dim": "#d1bcff",
        "error-container": "#93000a",
        "surface-tint": "#d6baff",
        "background": "#131315",
        "secondary-container": "#47464b",
        "on-secondary-container": "#b6b4b9",
        "outline": "#958da2",
        "primary-fixed": "#ecdcff",
        "surface-container-highest": "#353437",
        "on-primary": "#430089",
        "surface-dim": "#131315",
        "on-background": "#e5e1e4",
        "tertiary": "#d1bcff",
        "on-secondary-fixed-variant": "#47464b",
        "on-error-container": "#ffdad6",
        "secondary": "#c8c5cb",
        "on-tertiary-container": "#d1bcff",
        "on-surface-variant": "#cbc3d9",
        "tertiary-container": "#6500e7",
        "surface-container-high": "#2a2a2c",
        "on-primary-container": "#d6baff",
        "primary-fixed-dim": "#d6baff",
        "surface-container-lowest": "#0e0e10",
        "on-error": "#690005",
        "tertiary-fixed": "#e9ddff",
        "surface-bright": "#39393b",
        "on-primary-fixed": "#280057",
        "secondary-fixed": "#e4e1e7",
        "on-tertiary": "#3c0090",
        "on-secondary": "#303034",
        "primary": "#d6baff",
        "error": "#ffb4ab",
        "on-tertiary-fixed": "#23005b",
        "surface-container-low": "#1b1b1d",
        "on-secondary-fixed": "#1b1b1f",
        "inverse-primary": "#7931d9",
        "outline-variant": "#494456",
        "secondary-fixed-dim": "#c8c5cb",
        "on-tertiary-fixed-variant": "#5700c9",
        "surface-container": "#201f21",
        "surface-variant": "#353437",
        "inverse-on-surface": "#313032"
      },
      fontFamily: {
        "headline": ["Space Grotesk", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "0.75rem"
      },
      keyframes: {
        "ripple": {
          "0%": { transform: "scale(1)", opacity: "0.8" },
          "100%": { transform: "scale(6)", opacity: "0" },
        }
      },
      animation: {
        "ripple": "ripple 3s ease-in-out infinite"
      },
    },
  },
  plugins: [],
}
