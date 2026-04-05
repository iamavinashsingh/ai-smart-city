# AI Pothole Detection: Backend Engine (FastAPI + YOLOv12)

![Project Banner](../assets/banner.png)

## 🏗️ System Architecture & Workflow
The backend is designed as a **High-Fidelity AI Inference Engine**. It processes raw, high-resolution user-uploaded images, extracts geospatial hazards, and pushes them to a globally distributed cloud infrastructure.

### The "Edge-to-Cloud" Pipeline:
1. **Ingestion**: The FastAPI server receives a multipart/form-data payload containing a raw image (3–5 MB) and HTML5 GPS coordinates.
2. **AI Inference (YOLOv12)**: The image is passed to a pre-loaded, singleton YOLOv12 model. To prevent blocking the main event loop, this task is delegated to a background thread pool.
3. **CDN Compression (Cloudinary)**: Simultaneously, the raw image is streamed to Cloudinary using an auto-quality flag, reducing it to a lightweight WebP (~200KB) URL.
4. **Data Aggregation**: Detection results (bounding boxes, confidence), GPS coordinates, and the CDN URL are aggregated into a single document.
5. **NoSQL Persistence (MongoDB Atlas)**: The document is logged into a geospatial collection for real-time heatmap rendering.

---

## 📂 Project Structure (Layered Micro-Service Architecture)

```plaintext
backend/
├── .env                        # Critical: Environment secrets (Cloudinary, Mongo)
├── requirements.txt            # System dependencies (Fastapi, Ultralytics, Motor)
├── best.pt                     # Fine-tuned YOLOv12S Pothole Model (62.2% mAP50)
│
└── app/                        # Main Application Container
    ├── main.py                 # Entry point with Lifespan & Singleton loading
    │
    ├── api/                    
    │   └── routes.py           # Traffic Controller: Defines /detect and /potholes
    │
    ├── core/                   
    │   └── config.py           # Security Layer: Pydantic-Settings management
    │
    ├── services/               # The "Brain" (Business Logic Layer)
    │   ├── ai_service.py       # YOLOv12 Inference & Thread-pooling logic
    │   ├── storage_service.py  # Cloudinary SDK Integration & Optimization
    │   └── db_service.py       # Async MongoDB Atlas (Motor) operations
    │
    └── schemas/                
        └── models.py           # Data Validation: Pydantic schemas for API I/O
```

---

## ⚡ Engineering Strategies

### 1. Singleton Model Loading (Lifespan Context)
The fine-tuned YOLOv12S model is loaded once at startup using **FastAPI Lifespan** to avoid per-request cold-starts. A runtime compatibility patch bridges the original `sunsmarterjie/yolov12` fork weights with the latest Ultralytics engine.

### 2. Async Non-Blocking Execution
Since YOLO inference is a CPU-bound task, it would ordinarily "block" our async server. We use `asyncio.to_thread` to push these heavy computations to a background executor, allowing the server to handle multiple uploads concurrently.

### 3. Intelligent Storage Optimization
We leverage Cloudinary's `quality="auto"` and `fetch_format="webp"` transformation. This drastically reduces bandwidth costs and improves Map Dashboard loading speeds without losing pixel-level evidence of road hazards.

---

## 🛠️ API Reference

### 📡 POST `/api/v1/detect`
Processes a new road scan and logs the hazard.

**Request (Form-Data):**
- `image`: File (JPG/PNG)
- `latitude`: Float
- `longitude`: Float

**Response (JSON):**
```json
{
  "success": true,
  "message": "Detected 2 potholes.",
  "image_url": "https://res.cloudinary.com/.../image.webp",
  "detections": [
    { "bbox": [10, 20, 100, 200], "confidence": 0.89 }
  ],
  "timestamp": "2024-04-03T18:00:00Z",
  "location": { "lat": 19.076, "lng": 72.877 }
}
```

### 📡 GET `/api/v1/potholes`
Retrieves historical logs for the Map Grid.

**Response (JSON):**
```json
{
  "success": true,
  "data": [
    { "latitude": 19.102, "longitude": 72.845, "severity": "Critical", ... }
  ]
}
```

---

## 🚀 Local Setup

1. **Install Python 3.9+**
2. **Environment Configuration**: Rename `.env.example` to `.env` and fill in:
   - `MONGO_URI`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
3. **Installation**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Execution**:
   ```bash
   uvicorn app.main:app --reload
   ```
