# 🌐 Edge-to-Cloud AI Pothole Detection System - Frontend

## 📖 Project Overview

The frontend of the Edge-to-Cloud AI Pothole Detection system is a modern, responsive single-page application (SPA) built with React. It serves as the primary visual interface for smart city administrators, maintenance crews, and public users to interact with the underlying YOLOv12 inference engine. The application encompasses three core vertical experiences: 
1. Educating users on the system via the engaging **Landing Page**.
2. Facilitating live pothole scanning and real-time bounding-box visualization on the **Scan Page**.
3. Monitoring infrastructure globally via geographic live-feeds rendered natively on the **Map Dashboard**.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/) |
| **3D Rendering** | [Three.js](https://threejs.org/) + [Three-Globe](https://github.com/vasturiano/three-globe) |
| **GIS Mapping** | [Leaflet](https://leafletjs.com/) + [React-Leaflet](https://react-leaflet.js.org/) + [Leaflet.heat](https://github.com/Leaflet/Leaflet.heat) |
| **Component UI** | [Lucide React](https://lucide.dev/) + [Shadcn UI](https://ui.shadcn.com/) |

---

## 📂 Folder Structure

```text
frontend/
├── public/                 # Static public assets (favicons, manifest)
├── src/
│   ├── assets/             # Images, static media, and local styling assets
│   ├── components/         # Reusable presentation UI elements
│   │   ├── layout/         # Structural components (Header, Footer)
│   │   └── sections/       # Complex page sections (Hero, Feature grids, etc.)
│   ├── lib/                # Utility functions, API wrappers, and helper modules
│   ├── pages/              # Core route controllers
│   │   ├── LandingPage.tsx # Product introduction and capabilities
│   │   ├── MapPage.tsx     # Geospatial live dashboard & mapping
│   │   └── ScanRoad.tsx    # Upload form and Canvas API bounding-box rendering
│   ├── App.tsx             # Root component and DOM routing configuration
│   ├── index.css           # Global CSS and atomic Tailwind directives
│   └── main.tsx            # React DOM injection entry point
├── .env.example            # Environment variables template
├── eslint.config.js        # Linter rules and configurations
├── package.json            # Project dependencies and operational scripts
├── tailwind.config.js      # Custom theme injection (Material Design 3 Palette)
└── vite.config.ts          # Vite build pipeline configuration
```

## 🧩 Key Pages & Core Functionality

### 1. `LandingPage.tsx`
Provides an interactive product overview utilizing `framer-motion` for dynamic micro-animations. It highlights crucial system capabilities such as edge computing workflows, robust CDN integration, and real-time mapping dashboards, serving to guide the user into the primary interaction flows.

### 2. `ScanRoad.tsx` (Inference Client)
Forms the primary entry vector for the AI model pipeline. 
- Empowers users to intuitively upload localized road captures (JPEG/PNG/WebP).
- Natively accesses the browser's Geolocation API to attach accurate coordinates.
- Manages standard HTML `FormData` constructs to transmit multimedia directly to the FastAPI inference endpoints.
- Uniquely leverages the HTML5 `<canvas>` element to accurately interpret scaling logic and intelligently draw distinct bounding boxes over the processed image based on AI telemetry.

### 3. `MapPage.tsx` (Telemetry Dashboard)
A dedicated geospatial dashboard engineered organically to fit the user's viewport safely without arbitrary scrolling constraints.
- Orchestrates `react-leaflet` to visualize robust and interactive street architectures.
- Implements a fixed-height responsive side-panel feed retrieving the most recent detection anomalies seamlessly from the backend.
- Intended for heatmap implementations projecting MongoDB coordinate logs directly onto the infrastructure grid.

## 🔄 State Management, Routing, & Data Flow

- **Routing Protocol:** Handled declaratively via `react-router-dom` in `App.tsx` ensuring standard structural abstractions (wrapping dynamic route outputs securely between shared `Header` and `Footer` layout templates).
- **State Design:** Native React primitives (`useState`, `useEffect`, `useRef`) are applied exclusively over thick global abstractions (like Redux). This intentionally constrains component-level state tightly to respective views (e.g., maintaining upload progress logic solely within `ScanRoad.tsx`), thus preserving application speed and predictability.
- **Information Flow:** Strictly unidirectional. Parent page components capture edge-effects (REST calls) and filter deterministic data down via props to strictly visually cohesive, pure presentation components.

## 📡 API Integration

The frontend acts as an isolated presentation tier querying the centralized FastAPI platform over robust REST patterns using the native Fetch API.
- **Execution Endpoint (`POST /api/v1/detect`)**: Triggered sequentially from `ScanRoad.tsx`. The frontend packs the uploaded media and active GPS parameters into a structured blob, requests execution, and seamlessly maps the returned confidence scores and geometric coordinate configurations.
- **Telemetry Aggregation (`GET /api/v1/potholes`)**: Invoked routinely by `MapPage.tsx` upon mount, systematically gathering chronological pothole occurrences natively fed directly into dashboard DOM states.

## 🎨 Styling & Design Aesthetics

- **Core Engine**: Tailwind CSS intelligently orchestrates highly optimized atomic rule generations natively bypassing generic external style-sheets.
- **Theming System**: The application strictly enforces a premium, custom dark-mode taxonomy governed within `tailwind.config.js`. It meticulously implements the **Material Design 3 (MD3) Dark Surface** specification employing dedicated tokens (e.g., `surface-container-high`, `primary-fixed`, `on-tertiary-container`).
- **Dynamic Interactions**: Specific CSS keyframes (`ripple`, `float-up`, `shimmer`) operate smoothly directly off the GPU, tightly harmonized via `framer-motion` hooks enabling fluid entrance and sophisticated exit routing semantics.
- **Modern Paradigms**: Auxiliary modules such as `clsx` and `tailwind-merge` actively eliminate logical CSS collisions during conditional class renderings, while `lucide-react` injects standardized, responsive SVGs natively.

## 📦 Core Dependencies

Primary integrations documented comprehensively securely inside `package.json`:
- **Architecture**: `react` & `react-dom` (v19), `vite` (v8).
- **Navigation Engine**: `react-router-dom`.
- **Cosmetics & Typography**: `tailwindcss`, `postcss`, `framer-motion`.
- **Geospatial Processing**: `leaflet`, `react-leaflet`, `leaflet.heat`.
- **3D Integrations (Optional)**: `three`, `three-globe`.

## 🛠️ Build & Deployment Procedure

### 1. Prerequisites
- `Node.js 20+` or parallel runtime wrappers (`bun`/`pnpm`).

### 2. Dependency Resolution
Execute the subsequent script localized at the directory root:
```bash
npm install
```

### 3. Environment Definition
Produce an inaccessible local `.env` corresponding perfectly to the explicit `.env.example` mapping the relevant API URL:
```env
VITE_API_URL=http://localhost:8000
```

### 4. Spawning Development Environment
```bash
npm run dev
# Vite runtime mounts implicitly binding to http://localhost:5173
```

### 5. Production Compilation
```bash
npm run build
# Compiles core React abstractions safely and trans-piles TS parameters, subsequently extracting fully optimized static deliverables directly into /dist
```
The immutable `/dist` compilation seamlessly accommodates implementations across robust static deployment channels (Vercel, AWS S3, NGINX).

## 🚀 Usage Guidelines & Best Practices

- **Logical Integrity**: Sustain logic separation faithfully enforcing explicit visual derivations directly located within `src/components/sections` preventing arbitrary UI bloat inside strictly logical `src/pages` elements.
- **Aesthetic Precision**: Abstain outright from arbitrarily embedding explicit styling parameters directly on components. Uniformly invoke pre-orchestrated Tailwind `tailwind.config.js` color aliases dynamically upholding unified platform aesthetics securely.
- **Responsive Scalability**: Maintain a devout mobile-first approach particularly across dynamic interactive instances explicitly dictating functional stability natively throughout strict device definitions and diverse scaling logic limits (e.g., preserving fixed `100vh` rules without introducing destructive scrolling artifacts).
