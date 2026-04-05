import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Split vendor chunks for better long-term caching
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "map-vendor": ["leaflet", "react-leaflet", "leaflet.heat"],
          "three-vendor": ["three", "three-globe"],
          "motion-vendor": ["framer-motion"],
          "date-vendor": ["date-fns"],
        },
      },
    },
    // Raise warning threshold to 800kb before splitting more
    chunkSizeWarningLimit: 800,
    // Enable source maps in production for error tracking
    sourcemap: false,
    // Minify with esbuild (default, fastest)
    minify: "esbuild",
    // Target modern browsers for smaller output
    target: "es2020",
  },
  // Optimise dep pre-bundling
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "framer-motion", "date-fns"],
  },
})
