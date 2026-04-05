/**
 * leaflet.heat is a legacy UMD plugin that expects the global `L` variable.
 * In Vite's ESM-based build, `L` is only module-scoped, so we must
 * pin it to `window.L` BEFORE importing leaflet.heat.
 */
import L from "leaflet";
(window as any).L = L; // expose global so leaflet.heat can find it
import "leaflet.heat";
