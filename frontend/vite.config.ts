import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"

/**
 * leaflet.heat is a plain global script — it does `L.heatLayer = ...`
 * expecting `L` to be window.L.  Inside Vite's ESM bundle `L` is only a
 * local module variable, so we must inject `import L from 'leaflet'`
 * into leaflet.heat's source BEFORE the bundler sees it.
 */
function leafletHeatFix(): Plugin {
  return {
    name: "leaflet-heat-fix",
    transform(code, id) {
      if (id.includes("leaflet.heat")) {
        return {
          code: `import L from 'leaflet';\n${code}`,
          map: null,
        };
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), leafletHeatFix()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Split vendor chunks for better long-term caching
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react")) return "react-vendor";
            if (id.includes("leaflet")) return "map-vendor";
            if (id.includes("three")) return "three-vendor";
            if (id.includes("framer-motion")) return "motion-vendor";
            if (id.includes("date-fns")) return "date-vendor";
            return "vendor";
          }
        },
      },
    },
    // Raise warning threshold to 800kb before splitting more
    chunkSizeWarningLimit: 800,
    // Enable source maps in production for error tracking
    sourcemap: false,
    // Minify with OXC — Vite 8 built-in, no extra package needed
    minify: "oxc",
    // Target modern browsers for smaller output
    target: "es2020",
  },
  // Optimise dep pre-bundling
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "framer-motion", "date-fns"],
  },
})
