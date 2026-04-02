# 🛣️ AI Pothole Detector — Smart Infrastructure Monitor

![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Three.js](https://img.shields.io/badge/threejs-black?style=for-the-badge&logo=three.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

An advanced, production-ready frontend for a real-time **AI-Powered Pothole Detection and Mapping System**. This platform leverages Computer Vision (YOLOv12) and Geospatial visualization to identify, monitor, and prioritize road infrastructure repairs across Indian urban centers.

---

## 🚀 Overview

The **AI Pothole Detector** is designed for smart city municipalities to crowdsource and automate road maintenance. By combining high-end 3D globe visualizations with detailed street-level heatmaps, it provides a dual-interface approach to infrastructure management.

### Key Features:
- 🌍 **Global Monitoring**: A 3D Interactive Globe highlighting India's regional structural health.
- 🔥 **Live Infrastructure Heatmap**: Dynamic density clusters (via Leaflet.heat) visualizing current pothole hotspots.
- 📸 **AI Scan Engine**: Dedicated interface for uploading road imagery with real-time inference simulations.
- ⚡ **Responsive Dashboard**: A 100vh "No-Scroll" desktop environment optimized for monitoring rooms.
- 📱 **Mobile Optimized**: Adaptive layouts for edge capture and on-field inspection.

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

## 📁 Project Structure

The project follows a modular, feature-based architecture ensuring high scalability and maintainability.

```text
frontend/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx         # Responsive Nav with Framer-motion links
│   │   │   └── Footer.tsx         # Project metadata and legal links
│   │   └── sections/
│   │       ├── Hero.tsx           # Interactive Canvas particle background
│   │       ├── HowItWorks.tsx     # Step-by-step workflow overview
│   │       ├── MapPreview.tsx     # 3D Globe focused on India (Three-Globe)
│   │       ├── TechHighlight.tsx  # YOLOv12 model technical specs
│   │       ├── Benefits.tsx       # Stakeholder advantage cards
│   │       └── CtaBanner.tsx      # Final engagement section
│   ├── pages/
│   │   ├── LandingPage.tsx        # Homepage (Modular segments)
│   │   ├── ScanRoad.tsx           # AI Inference and Image Upload Interface
│   │   └── MapPage.tsx            # Live Pothole Dashboard & MongoDB Feed
│   ├── lib/
│   │   └── utils.ts               # Tailind-merge & Clsx utilities
│   ├── App.tsx                    # Main Routing and Layout Logic
│   ├── index.css                  # Global Design System (Tokens/Themes)
│   └── main.tsx                   # React Entrypoint
├── public/                        # Static Assets
├── index.html                     # HTML Template & Google Fonts
├── tailwind.config.js             # Advanced Design Token configuration
├── tsconfig.json                  # TypeScript configuration
└── vite.config.ts                 # Build & Path Alias settings
```

---

## ⚙️ Dependencies

- **Interactive UI**: `framer-motion` for smooth layout transitions.
- **Geospatial**: `leaflet`, `react-leaflet`, `leaflet.heat` for heatmap layers.
- **Visuals**: `three`, `three-globe` for the starting globe simulation.
- **Routing**: `react-router-dom` for client-side navigation.
- **Utilities**: `lucide-react`, `clsx`, `tailwind-merge`.

---

## 🔄 Project Workflow

1. **Detection Phase**: Users capture road imagery via the `/scan` interface.
2. **Inference Phase**: Imagery is processed against the **YOLOv12 Neural Engine** (FastAPI backend integration).
3. **Database Phase**: Document metadata (Lat/Lng, Severity, Timestamp) is stored in **MongoDB**.
4. **Visualization Phase**:
   - The `/map` dashboard fetches the latest nodes asynchronously.
   - Points are rendered into a weighted **Density Heatmap**.
   - The **Recent Detections Feed** provides a chronological view of incoming reports.

---

## 🚦 Getting Started

### Prerequisites:
- `Node.js v14.0+`
- `npm` or `yarn`

### Installation:

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Launch development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

---

## 🏛️ Architecture Design Decisions

- **Path Aliasing**: Uses `@/*` aliases for cleaner import management.
- **Dynamic Viewport Sensing**: Implements `dvh` units for robust mobile UI stability.
- **Memory Safety**: 3D and Map instances are strictly managed via React `useEffect` hooks to prevent memory leaks during route changes.

---

Designed with 💜 for Smart Infrastructure in India.
© 2026 AI Pothole Detector.
