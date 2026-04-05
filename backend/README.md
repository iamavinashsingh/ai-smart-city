# 🚧 Edge-to-Cloud AI Pothole Detection System - Backend

## 📖 Project Overview

The backend of the Edge-to-Cloud AI Pothole Detection System is a high-performance Python-based REST API designed for processing and classifying road surface anomalies natively from edge devices. It relies on the rigorous speed and accuracy of a trained YOLOv12 architecture for pothole detection, offloads heavy multimedia to a globally distributed CDN (Cloudinary), and logs geospatial time-series telemetry natively into a modern document store (MongoDB Atlas). Built utilizing FastAPI, the architecture prioritizes non-blocking asynchronous execution and a clean separation of concerns.

## 📂 Folder Structure

```text
backend/
├── app/
│   ├── api/
│   │   └── routes.py         # FastAPI endpoint controllers
│   ├── core/
│   │   └── config.py         # Pydantic environment configuration
│   ├── schemas/
│   │   └── models.py         # Data validation & response models
│   ├── services/
│   │   ├── ai_service.py     # YOLOv12 inference logic
│   │   ├── db_service.py     # MongoDB interactions
│   │   └── storage_service.py # Cloudinary CDN integration
│   └── main.py               # Application entry point & lifecycle management
├── .env.example              # Template for required environment variables
├── best.pt                   # Pre-trained YOLOv12 model weights
├── Dockerfile                # Containerization manifests
├── requirements.txt          # Defines production dependencies
└── README.md                 # Project documentation
```

## 🧩 Key Modules & Core Functions

### 1. `app/main.py` (Application Lifecycle)
Acts as the central orchestrator. It registers endpoints, configures CORS, handles structured HTTP logging via custom middleware, and manages a `lifespan` context manager. This latter mechanism ensures the heavy YOLOv12 model and the MongoDB connection pools are loaded into memory exactly once at startup, successfully removing per-request operational overhead.

### 2. `app/services/ai_service.py` (AI Inference Engine)
Integrates the `ultralytics` package to deserialize incoming images and execute neural network inference. It efficiently predicts bounding boxes and confidence scores, filtering for specific pothole classifications.

### 3. `app/services/storage_service.py` (CDN Integration)
Handles server-side asynchronous image uploads to Cloudinary. Raw captures are persisted to a robust CDN, generating scalable public image URLs that minimize payload footprints for downstream dashboard consumption.

### 4. `app/services/db_service.py` (Database Layer)
Interfaces seamlessly with MongoDB Atlas via the `motor` asynchronous driver. It securely persists high-fidelity logs containing geospatial metrics (Latitude/Longitude), detection counts, severity classifications, and remote image references.

## 📡 API Documentation

### 1. Detect Pothole
**`POST /api/v1/detect`**
Executes an edge-to-cloud inference pipeline: receives a captured road image, detects potholes via YOLOv12, uploads the resulting image to Cloudinary, logs geospatial data to MongoDB, and returns a fully structured payload.

- **Content-Type**: `multipart/form-data`
- **Payload Requirements**:
  - `image` (File): Road capture (JPEG / PNG / WebP).
  - `latitude` (Float): GPS latitude of the capture point.
  - `longitude` (Float): GPS longitude of the capture point.
- **Example Response (200 OK)**:
```json
{
  "success": true,
  "message": "Detected 2 pothole(s). Severity: High.",
  "image_url": "https://res.cloudinary.com/...",
  "detections": [
    {
      "bbox": [150.5, 200.0, 300.5, 450.0],
      "confidence": 0.89
    }
  ],
  "timestamp": "2026-04-05T12:00:00Z",
  "location": {"lat": 40.7128, "lng": -74.0060}
}
```

### 2. Retrieve Pothole Feed
**`GET /api/v1/potholes?limit={count}`**
Retrieves historical, paginated pothole detections. Currently tailored to fuel live data feeds powering the frontend geographic dashboards.

- **Query Parameters**: `limit` (Int, default 50, range 1-200)
- **Example Response (200 OK)**:
```json
{
  "success": true,
  "count": 50,
  "data": [
    {
      "id": "60e1d...",
      "image_url": "https://...",
      "severity": "Critical",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "timestamp": "2026-04-05T12:00:00Z"
    }
  ]
}
```

### 3. System Diagnostics
**`GET /health`**
Lightweight liveness probe ensuring the platform is healthy for Kubernetes deployments/container orchestrators.
**`GET /`**
Root greeting with link reference to Swagger documentation.

## 📦 Dependencies

Defined in `requirements.txt`. The application stack leverages:
- **Core Server**: `fastapi` & `uvicorn[standard]` (High-performance API framework and ASGI server)
- **AI / Computer Vision**: `ultralytics>=8.3.71`, `opencv-python-headless`, `pillow`
- **Cloud / Storage Layer**: `cloudinary`
- **Persistence**: `motor`, `pymongo` (Async driver for MongoDB Atlas)
- **Ecosystem Tooling**: `pydantic-settings`, `python-dotenv`, `python-multipart`

## 🛠️ Setup Instructions & Usage Guidelines

### 1. Prerequisites
- `Python 3.10+` running securely in your local or containerized environment
- MongoDB Atlas cluster URL (with whitelisted IP configurations)
- Cloudinary Developer Account (Cloud Name, API Key, API Secret)

### 2. Environment Configuration
Create a `.env` file at the root of the `backend` directory. Use the provided `.env.example` as a baseline:
```env
# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# MongoDB
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=SmartCityDB
COLLECTION_NAME=PotholeLogs

# Application
MODEL_PATH=best.pt
PORT=8000
```

### 3. Installation
Navigate into the backend project root and systematically setup dependencies. Note: Establishing a protected virtual environment is strictly recommended. 
```bash
# Generate and step into a virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (Linux / macOS)
source venv/bin/activate

# Fetch Requirements
pip install -r requirements.txt
```

### 4. Bootstrapping Development Server
Launch the server to evaluate integrations natively:
```bash
python -m app.main
```
Alternatively, utilizing Uvicorn explicitly with hot-reloading:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
**Interactive Documentation**: Validate APIs using standard Swagger UI implicitly bundled with FastAPI: Navigate to [http://localhost:8000/docs](http://localhost:8000/docs).
